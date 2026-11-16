import sql from "@/lib/db";

/**
 * The small store every plugin instance gets. Rows are addressed by (instance, collection, key); the host never looks
 * inside `value`. Always pass the instance id from a verified instance, never one taken from user input.
 */
export interface DataRow<T> {
  key: string;
  value: T;
  created_by: string;
  created_at: Date;
}

export function listData<T>(instanceId: string, collection: string) {
  return sql<DataRow<T>[]>`
    SELECT key, value, created_by, created_at FROM plugin_data
    WHERE instance_id = ${instanceId} AND collection = ${collection} ORDER BY created_at, key
  `;
}

export async function getData<T>(instanceId: string, collection: string, key: string): Promise<DataRow<T> | null> {
  const [row] = await sql<DataRow<T>[]>`
    SELECT key, value, created_by, created_at FROM plugin_data
    WHERE instance_id = ${instanceId} AND collection = ${collection} AND key = ${key}
  `;
  return row ?? null;
}

export const putData = (instanceId: string, collection: string, key: string, value: Record<string, unknown>, createdBy: string) => sql`
  INSERT INTO plugin_data (instance_id, collection, key, value, created_by)
  VALUES (${instanceId}, ${collection}, ${key}, ${sql.json(value as never)}, ${createdBy})
  ON CONFLICT (instance_id, collection, key) DO UPDATE SET value = EXCLUDED.value
`;

export const deleteData = (instanceId: string, collection: string, key: string) =>
  sql`DELETE FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${collection} AND key = ${key}`;

export async function countData(instanceId: string, collection: string): Promise<number> {
  const [row] = await sql<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM plugin_data WHERE instance_id = ${instanceId} AND collection = ${collection}`;
  return row.n;
}
