import { randomBytes, randomUUID } from "node:crypto";
import sql from "@/lib/db";
import { getParticipants } from "@/lib/activities";
import { firstName, MAX_MARKS, MAX_PLAYERS, playerIdForUser } from "./logic";

/** Scoreboard data lives in the plugin store: collection "player" (one row each) and "tick" (one row per mark, an audit trail). */
const PLAYERS = "player";
const TICKS = "tick";

export interface Player {
  id: string;
  name: string;
  marks: number;
  /** Secret of the player's personal link. Server-side only: never render another player's key. */
  editKey: string;
}

export function getPlayers(instanceId: string): Promise<Player[]> {
  return sql<Player[]>`
    SELECT p.key AS id, p.value->>'name' AS name, p.value->>'editKey' AS "editKey", COALESCE(t.marks, 0)::int AS marks
    FROM plugin_data p
    LEFT JOIN (
      SELECT value->>'player' AS player, COUNT(*) AS marks FROM plugin_data
      WHERE instance_id = ${instanceId} AND collection = ${TICKS} GROUP BY 1
    ) t ON t.player = p.key
    WHERE p.instance_id = ${instanceId} AND p.collection = ${PLAYERS}
    ORDER BY p.created_at, p.key
  `;
}

export async function getPlayer(instanceId: string, playerId: string): Promise<Player | null> {
  const [row] = await sql<Player[]>`
    SELECT p.key AS id, p.value->>'name' AS name, p.value->>'editKey' AS "editKey",
      (SELECT COUNT(*) FROM plugin_data t WHERE t.instance_id = p.instance_id AND t.collection = ${TICKS} AND t.value->>'player' = p.key)::int AS marks
    FROM plugin_data p WHERE p.instance_id = ${instanceId} AND p.collection = ${PLAYERS} AND p.key = ${playerId}
  `;
  return row ?? null;
}

/**
 * Adds a player unless the board is full. Returns whether a row was added. A player linked to a user gets a fixed id per
 * person, so adding the same subscriber twice (two signups at once, or an import after an automatic add) is harmless.
 */
export async function addPlayer(instanceId: string, name: string, createdBy: string, userId: string | null = null): Promise<boolean> {
  const [{ n }] = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${PLAYERS}`;
  if (n >= MAX_PLAYERS) return false;
  const key = userId ? playerIdForUser(instanceId, userId) : randomUUID();
  const value = { name, userId, editKey: randomBytes(16).toString("base64url") };
  const added = await sql`
    INSERT INTO plugin_data (instance_id, collection, key, value, created_by)
    VALUES (${instanceId}, ${PLAYERS}, ${key}, ${sql.json(value)}, ${createdBy})
    ON CONFLICT (instance_id, collection, key) DO NOTHING
    RETURNING key
  `;
  return added.length > 0;
}

/** Adds one subscriber (first name only), e.g. when they sign up. Does nothing for someone already on the board. */
export async function addSubscriber(instanceId: string, userId: string): Promise<void> {
  const [user] = await sql<{ name: string | null }[]>`SELECT name FROM "user" WHERE id = ${userId}`;
  const name = firstName(user?.name ?? "");
  if (name !== "") await addPlayer(instanceId, name, "subscription", userId);
}

export async function removePlayer(instanceId: string, playerId: string): Promise<void> {
  await sql`DELETE FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${TICKS} AND value->>'player' = ${playerId}`;
  await sql`DELETE FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${PLAYERS} AND key = ${playerId}`;
}

/** Adds one mark, unless the player already has the maximum. The check and the insert are one statement, so the cap holds up to a handful of simultaneous taps (not strictly under READ COMMITTED, which is harmless). */
export async function addMark(instanceId: string, playerId: string, createdBy: string): Promise<void> {
  await sql`
    INSERT INTO plugin_data (instance_id, collection, key, value, created_by)
    SELECT ${instanceId}, ${TICKS}, ${randomUUID()}, ${sql.json({ player: playerId })}, ${createdBy}
    WHERE (SELECT COUNT(*) FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${TICKS} AND value->>'player' = ${playerId}) < ${MAX_MARKS}
  `;
}

/** Removes the player's most recent mark. */
export async function undoMark(instanceId: string, playerId: string): Promise<void> {
  await sql`
    DELETE FROM plugin_data
    WHERE instance_id = ${instanceId} AND collection = ${TICKS} AND key = (
      SELECT key FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${TICKS} AND value->>'player' = ${playerId}
      ORDER BY created_at DESC, key DESC LIMIT 1
    )
  `;
}

/** Adds everyone subscribed to the activity (first names) who is not on the board yet. Returns how many were added. */
export async function importSubscribers(instanceId: string, activityId: string, createdBy: string): Promise<number> {
  const [existing, participants] = await Promise.all([
    sql<{ user_id: string | null }[]>`SELECT value->>'userId' AS user_id FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${PLAYERS}`,
    getParticipants(activityId),
  ]);
  const known = new Set(existing.map((r) => r.user_id));
  let added = 0;
  for (const person of participants) {
    const name = firstName(person.name ?? "");
    if (known.has(person.id) || name === "") continue;
    if (!(await addPlayer(instanceId, name, createdBy, person.id))) break;
    added++;
  }
  return added;
}
