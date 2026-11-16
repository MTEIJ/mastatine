import sql from "@/lib/db";

export interface RoleRow {
  user_id: string;
  name: string;
  email: string;
  role: "treasurer" | "auditor";
  granted_by_name: string;
  granted_at: Date;
}

/** Everyone who was given a finance role in the app (the env bootstrap list is separate). */
export async function listRoles(): Promise<RoleRow[]> {
  return sql<RoleRow[]>`
    SELECT r.user_id, u.name, u.email, r.role, r.granted_by_name, r.granted_at
    FROM finance_roles r JOIN "user" u ON u.id = r.user_id
    ORDER BY r.role, lower(u.name)
  `;
}

export interface AccessChange {
  id: number;
  at: Date;
  actor_name: string;
  action: string;
  detail: { email?: string; role?: string };
}

/** The latest grants and revokes, from the append-only audit log. Shown to finance users so changes cannot go unnoticed. */
export async function recentAccessChanges(limit = 10): Promise<AccessChange[]> {
  return sql<AccessChange[]>`
    SELECT id::int, at, actor_name, action, detail FROM finance_audit
    WHERE action IN ('access_granted', 'access_revoked') ORDER BY id DESC LIMIT ${limit}
  `;
}
