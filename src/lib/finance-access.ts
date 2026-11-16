import { cache } from "react";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import { getSession } from "@/lib/session";

/** "write" = treasurer (can add entries, receipts and budgets); "read" = auditor (kascommissie), who can only look. */
export type FinanceLevel = "read" | "write";

export interface FinanceAccess {
  userId: string;
  name: string;
  level: FinanceLevel;
  canWrite: boolean;
}

function emailsFrom(variable: string): Set<string> {
  return new Set(
    (process.env[variable] ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** The fixed bootstrap list from the server's environment. The admin page shows it but cannot change it. */
export function envFinanceEmails(): { treasurers: string[]; auditors: string[] } {
  return { treasurers: [...emailsFrom("FINANCE_TREASURER_EMAILS")], auditors: [...emailsFrom("FINANCE_AUDITOR_EMAILS")] };
}

function envLevel(email: string): FinanceLevel | null {
  const normalized = email.trim().toLowerCase();
  if (emailsFrom("FINANCE_TREASURER_EMAILS").has(normalized)) return "write";
  if (emailsFrom("FINANCE_AUDITOR_EMAILS").has(normalized)) return "read";
  return null;
}

async function grantedLevel(userId: string): Promise<FinanceLevel | null> {
  const [row] = await sql<{ role: string }[]>`SELECT role FROM finance_roles WHERE user_id = ${userId}`;
  if (!row) return null;
  return row.role === "treasurer" ? "write" : "read";
}

/**
 * The current visitor's finance access, or null. Access comes from the server's environment (bootstrap) or from a role
 * an admin granted in the admin area, by account id, so changing an email address cannot carry access along. Admins
 * are not given access just for being admins, and an impersonated session never has it. Deduplicated per request.
 */
export const getFinanceAccess = cache(async (): Promise<FinanceAccess | null> => {
  const session = await getSession();
  if (!session) return null;
  // Acting as someone else (admin impersonation) never carries finance access, and entries must name the real person.
  if ((session.session as { impersonatedBy?: string | null }).impersonatedBy) return null;
  const { user } = session;
  if (user.banned || user.emailVerified === false) return null;

  const levels = [envLevel(user.email), await grantedLevel(user.id)];
  const level: FinanceLevel | null = levels.includes("write") ? "write" : levels.includes("read") ? "read" : null;
  if (!level) return null;
  return { userId: user.id, name: user.name || "Unnamed", level, canWrite: level === "write" };
});

/** Pages and actions. Everyone without access gets a 404, so the area's existence is not advertised. */
export async function requireFinance(level: FinanceLevel = "read"): Promise<FinanceAccess> {
  const access = await getFinanceAccess();
  if (!access || (level === "write" && !access.canWrite)) notFound();
  return access;
}
