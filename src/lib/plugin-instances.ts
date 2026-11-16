import { randomBytes } from "node:crypto";
import sql from "@/lib/db";
import type { PluginInstance } from "@/plugins/types";

export const MAX_PLUGINS_PER_ACTIVITY = 10;

/** 128 bits of randomness, URL-safe: the whole secret behind a public plugin link. */
export const newToken = (): string => randomBytes(16).toString("base64url");

/** Tokens have exactly this shape; anything else is rejected before touching the database. */
export const TOKEN_SHAPE = /^[A-Za-z0-9_-]{22}$/;

const columns = () => sql`id, activity_id, plugin_id, config, public_token, position, enabled`;

export function getInstances(activityId: string, { onlyEnabled = false } = {}) {
  return sql<PluginInstance[]>`
    SELECT ${columns()} FROM activity_plugins
    WHERE activity_id = ${activityId} ${onlyEnabled ? sql`AND enabled` : sql``}
    ORDER BY position, created_at
  `;
}

export async function getInstance(id: string): Promise<PluginInstance | null> {
  const [row] = await sql<PluginInstance[]>`SELECT ${columns()} FROM activity_plugins WHERE id = ${id}`;
  return row ?? null;
}

export async function getInstanceByToken(token: string): Promise<PluginInstance | null> {
  if (!TOKEN_SHAPE.test(token)) return null;
  const [row] = await sql<PluginInstance[]>`SELECT ${columns()} FROM activity_plugins WHERE public_token = ${token} AND enabled`;
  return row ?? null;
}

export async function createInstance(activityId: string, pluginId: string, config: Record<string, unknown>): Promise<PluginInstance> {
  const [row] = await sql<PluginInstance[]>`
    INSERT INTO activity_plugins (activity_id, plugin_id, config, public_token, position)
    VALUES (
      ${activityId}, ${pluginId}, ${sql.json(config as never)}, ${newToken()},
      COALESCE((SELECT MAX(position) + 1 FROM activity_plugins WHERE activity_id = ${activityId}), 0)
    )
    RETURNING ${columns()}
  `;
  return row;
}

export const updateConfig = (id: string, config: Record<string, unknown>) =>
  sql`UPDATE activity_plugins SET config = ${sql.json(config as never)} WHERE id = ${id}`;

export const setEnabled = (id: string, enabled: boolean) => sql`UPDATE activity_plugins SET enabled = ${enabled} WHERE id = ${id}`;

/** The old link stops working immediately. */
export const regenerateToken = (id: string) => sql`UPDATE activity_plugins SET public_token = ${newToken()} WHERE id = ${id}`;

export const deleteInstance = (id: string) => sql`DELETE FROM activity_plugins WHERE id = ${id}`;

/** How many activities use each plugin. Counts only: the library must not reveal hidden activities. */
export async function getUsageCounts(): Promise<Map<string, number>> {
  const rows = await sql<{ plugin_id: string; n: number }[]>`SELECT plugin_id, COUNT(*)::int AS n FROM activity_plugins WHERE enabled GROUP BY plugin_id`;
  return new Map(rows.map((r) => [r.plugin_id, r.n]));
}
