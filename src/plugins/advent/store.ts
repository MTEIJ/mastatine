import { randomBytes, randomUUID } from "node:crypto";
import sql from "@/lib/db";
import { getParticipants } from "@/lib/activities";
import { firstName, playerIdForUser } from "../scoreboard/logic";
import { MAX_WALKERS, type Walker } from "./logic";

/** Advent calendar data lives in the plugin store: one "walker" row per person, holding where they stand and whether they died. */
const WALKERS = "walker";

export interface StoredWalker extends Walker {
  /** Secret of the walker's personal link. Server-side only: never render another walker's key. */
  editKey: string;
  /** The account this walker belongs to, when added from the subscribers. */
  userId: string | null;
}

const COLUMNS = `
  key AS id, value->>'name' AS name, value->>'editKey' AS "editKey",
  COALESCE((value->>'day')::int, 0) AS day, (value->>'diedOn')::int AS "diedOn",
  value->>'photo' AS photo, value->>'userId' AS "userId"
`;

export function getWalkers(instanceId: string): Promise<StoredWalker[]> {
  return sql<StoredWalker[]>`
    SELECT ${sql.unsafe(COLUMNS)} FROM plugin_data
    WHERE instance_id = ${instanceId} AND collection = ${WALKERS}
    ORDER BY created_at, key
  `;
}

export async function getWalker(instanceId: string, walkerId: string): Promise<StoredWalker | null> {
  const [row] = await sql<StoredWalker[]>`
    SELECT ${sql.unsafe(COLUMNS)} FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${WALKERS} AND key = ${walkerId}
  `;
  return row ?? null;
}

/**
 * Adds a walker on the start tile unless the map is full. Returns whether a row was added. A walker linked to a user gets
 * a fixed id per person, so adding the same subscriber twice is harmless.
 */
export async function addWalker(instanceId: string, name: string, createdBy: string, userId: string | null = null): Promise<boolean> {
  const [{ n }] = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${WALKERS}`;
  if (n >= MAX_WALKERS) return false;
  const key = userId ? playerIdForUser(instanceId, userId) : randomUUID();
  const value = { name, userId, editKey: randomBytes(16).toString("base64url"), day: 0 };
  const added = await sql`
    INSERT INTO plugin_data (instance_id, collection, key, value, created_by)
    VALUES (${instanceId}, ${WALKERS}, ${key}, ${sql.json(value)}, ${createdBy})
    ON CONFLICT (instance_id, collection, key) DO NOTHING
    RETURNING key
  `;
  return added.length > 0;
}

/** Adds one subscriber (first name only). Does nothing for someone already on the map. */
export async function addSubscriber(instanceId: string, userId: string): Promise<void> {
  const [user] = await sql<{ name: string | null }[]>`SELECT name FROM "user" WHERE id = ${userId}`;
  const name = firstName(user?.name ?? "");
  if (name !== "") await addWalker(instanceId, name, "subscription", userId);
}

/** Removes the walker. Returns the address of their photo, so the caller can delete the file. */
export async function removeWalker(instanceId: string, walkerId: string): Promise<string | null> {
  const [row] = await sql<{ photo: string | null }[]>`
    DELETE FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${WALKERS} AND key = ${walkerId}
    RETURNING value->>'photo' AS photo
  `;
  return row?.photo ?? null;
}

/**
 * Sets (or with null removes) the walker's photo. Returns the photo it replaced, so the caller can delete that file. The
 * old value is read under a row lock in the same statement, so two uploads at once cannot both miss the old file.
 */
export async function setWalkerPhoto(instanceId: string, walkerId: string, photo: string | null): Promise<{ found: boolean; old: string | null }> {
  const rows = await sql<{ old: string | null }[]>`
    WITH current AS (
      SELECT key, value->>'photo' AS old FROM plugin_data
      WHERE instance_id = ${instanceId} AND collection = ${WALKERS} AND key = ${walkerId}
      FOR UPDATE
    )
    UPDATE plugin_data p
    SET value = CASE WHEN ${photo}::text IS NULL THEN p.value - 'photo' ELSE jsonb_set(p.value, '{photo}', to_jsonb(${photo}::text)) END
    FROM current
    WHERE p.instance_id = ${instanceId} AND p.collection = ${WALKERS} AND p.key = current.key
    RETURNING current.old
  `;
  return { found: rows.length > 0, old: rows[0]?.old ?? null };
}

/**
 * One step forward or back, unless the walker is dead or it would leave the map. The rule is in the WHERE clause of a
 * single UPDATE, so two taps at once cannot push a walker past an edge.
 */
export async function stepWalker(instanceId: string, walkerId: string, delta: 1 | -1, days: number): Promise<void> {
  await sql`
    UPDATE plugin_data
    SET value = jsonb_set(value, '{day}', to_jsonb(COALESCE((value->>'day')::int, 0) + ${delta}::int))
    WHERE instance_id = ${instanceId} AND collection = ${WALKERS} AND key = ${walkerId}
      AND value->>'diedOn' IS NULL
      AND COALESCE((value->>'day')::int, 0) + ${delta}::int BETWEEN 0 AND ${days}::int
  `;
}

/** The walker failed on `day` (checked by the caller with canFailOn). Does nothing if they already failed. */
export async function killWalker(instanceId: string, walkerId: string, day: number): Promise<void> {
  await sql`
    UPDATE plugin_data
    SET value = jsonb_set(value, '{diedOn}', to_jsonb(${day}::int))
    WHERE instance_id = ${instanceId} AND collection = ${WALKERS} AND key = ${walkerId} AND value->>'diedOn' IS NULL
  `;
}

export async function reviveWalker(instanceId: string, walkerId: string): Promise<void> {
  await sql`
    UPDATE plugin_data SET value = value - 'diedOn'
    WHERE instance_id = ${instanceId} AND collection = ${WALKERS} AND key = ${walkerId}
  `;
}

/** Adds everyone subscribed to the activity (first names) who is not on the map yet. Returns how many were added. */
export async function importSubscribers(instanceId: string, activityId: string, createdBy: string): Promise<number> {
  const [existing, participants] = await Promise.all([
    sql<{ user_id: string | null }[]>`SELECT value->>'userId' AS user_id FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${WALKERS}`,
    getParticipants(activityId),
  ]);
  const known = new Set(existing.map((r) => r.user_id));
  let added = 0;
  for (const person of participants) {
    const name = firstName(person.name ?? "");
    if (known.has(person.id) || name === "") continue;
    if (!(await addWalker(instanceId, name, createdBy, person.id))) break;
    added++;
  }
  return added;
}
