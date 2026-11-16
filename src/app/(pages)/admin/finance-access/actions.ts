"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import sql from "@/lib/db";
import { logAudit } from "@/lib/finance";
import { requireAdmin } from "@/lib/session";

const PAGE = "/admin/finance-access";

const grantSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(["treasurer", "auditor"]),
});

/** Give an existing, verified account the treasurer or auditor role. Logged in the append-only finance audit. */
export async function grantFinanceRole(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = grantSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`${PAGE}?notice=invalid`);
  const { email, role } = parsed.data;

  const [target] = await sql<{ id: string; emailVerified: boolean; banned: boolean | null }[]>`
    SELECT id, "emailVerified", banned FROM "user" WHERE lower(email) = ${email}
  `;
  // Only people who already signed in once (so the address is proven) and are not banned.
  if (!target || !target.emailVerified || target.banned) redirect(`${PAGE}?notice=unknown-user`);

  const [before] = await sql<{ role: string }[]>`SELECT role FROM finance_roles WHERE user_id = ${target.id}`;
  await sql`
    INSERT INTO finance_roles (user_id, role, granted_by_id, granted_by_name)
    VALUES (${target.id}, ${role}, ${admin.user.id}, ${admin.user.name || "Unnamed"})
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role, granted_by_id = EXCLUDED.granted_by_id,
      granted_by_name = EXCLUDED.granted_by_name, granted_at = NOW()
  `;
  await logAudit({ userId: admin.user.id, name: admin.user.name || "Unnamed" }, "access_granted", {
    user_id: target.id,
    email,
    role,
    previous_role: before?.role ?? null,
  });
  revalidatePath("/", "layout");
  redirect(`${PAGE}?notice=granted`);
}

export async function revokeFinanceRole(formData: FormData) {
  const admin = await requireAdmin();
  const userId = z.string().min(1).max(100).safeParse(formData.get("user_id"));
  if (!userId.success) redirect(`${PAGE}?notice=invalid`);

  const [removed] = await sql<{ role: string; email: string }[]>`
    DELETE FROM finance_roles r USING "user" u WHERE r.user_id = ${userId.data} AND u.id = r.user_id RETURNING r.role, u.email
  `;
  if (removed) {
    await logAudit({ userId: admin.user.id, name: admin.user.name || "Unnamed" }, "access_revoked", {
      user_id: userId.data,
      email: removed.email.toLowerCase(),
      role: removed.role,
    });
  }
  revalidatePath("/", "layout");
  redirect(`${PAGE}?notice=revoked`);
}
