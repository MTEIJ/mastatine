import ConfirmButton from "@/components/admin/ConfirmButton";
import { envFinanceEmails } from "@/lib/finance-access";
import { listRoles, recentAccessChanges } from "@/lib/finance-roles";
import { requireAdmin } from "@/lib/session";
import { grantFinanceRole, revokeFinanceRole } from "./actions";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const instant = false;

const NOTICES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  granted: { text: "Access saved. It applies on their next page load.", tone: "ok" },
  revoked: { text: "Access removed.", tone: "ok" },
  invalid: { text: "Enter a valid email address.", tone: "bad" },
  "unknown-user": { text: "No active account with that email. They must have signed in once, and not be banned.", tone: "bad" },
};

const when = (d: Date) => new Date(d).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });

export default async function FinanceAccessPage(props: { searchParams: Promise<{ notice?: string }> }) {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const { notice } = await props.searchParams;
  const [roles, changes] = await Promise.all([listRoles(), recentAccessChanges(10)]);
  const env = envFinanceEmails();
  const message = notice ? NOTICES[notice] : undefined;

  return (
    <div className="max-w-3xl space-y-5">
      {message && (
        <p role="status" className={`rounded-md px-4 py-3 text-sm ${message.tone === "ok" ? "bg-accent-soft text-accent-text" : "bg-danger/10 text-danger"}`}>
          {message.text}
        </p>
      )}

      <p className="text-sm text-muted">
        The <strong>treasurer</strong> can add entries, receipts and budgets in the Finance app. An <strong>auditor</strong> (for example the
        kascommissie) can only look. Being an admin gives no finance access by itself. Every change is logged permanently and shown to
        everyone with finance access.
      </p>

      <section aria-labelledby="grant-title">
        <h2 id="grant-title" className="text-base font-extrabold">Give access</h2>
        <form action={grantFinanceRole} className={cardClass("mt-2 flex flex-wrap items-end gap-3 p-4")}>
          <div className="min-w-0 flex-1">
            <Label htmlFor="fa-email">Email of their account</Label>
            <Input id="fa-email" name="email" type="email" required maxLength={254} autoComplete="off" />
          </div>
          <div>
            <Label htmlFor="fa-role">Role</Label>
            <Select id="fa-role" name="role" defaultValue="treasurer">
              <option value="treasurer">Treasurer (can write)</option>
              <option value="auditor">Auditor (read only)</option>
            </Select>
          </div>
          <Button type="submit" variant="primary">Save</Button>
        </form>
      </section>

      <section aria-labelledby="who-title">
        <h2 id="who-title" className="text-base font-extrabold">Who has access</h2>
        <div className="table-wrap mt-2">
          <table className="table">
            <thead><tr><th>Person</th><th>Role</th><th>Set by</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {env.treasurers.map((email) => (
                <tr key={`env-t-${email}`}><td>{email}</td><td>Treasurer</td><td className="text-muted">Server settings (fixed)</td><td /></tr>
              ))}
              {env.auditors.map((email) => (
                <tr key={`env-a-${email}`}><td>{email}</td><td>Auditor</td><td className="text-muted">Server settings (fixed)</td><td /></tr>
              ))}
              {roles.map((r) => (
                <tr key={r.user_id}>
                  <td className="font-medium">{r.name || "No name"}<span className="block text-xs font-normal text-muted">{r.email}</span></td>
                  <td>{r.role === "treasurer" ? "Treasurer" : "Auditor"}</td>
                  <td className="text-muted">{r.granted_by_name}<span className="block text-xs">{when(r.granted_at)}</span></td>
                  <td className="text-right">
                    <form action={revokeFinanceRole}>
                      <input type="hidden" name="user_id" value={r.user_id} />
                      <ConfirmButton className={buttonClass({ variant: "danger", size: "sm" })} message={`Remove ${r.role} access for ${r.email}?`}>Remove</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              {roles.length + env.treasurers.length + env.auditors.length === 0 && (
                <tr><td colSpan={4} className="py-4 text-center text-muted">Nobody has finance access yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="log-title">
        <h2 id="log-title" className="text-base font-extrabold">Recent changes</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {changes.map((c) => (
            <li key={c.id} className="text-muted">
              {when(c.at)} · {c.actor_name} {c.action === "access_granted" ? "gave" : "removed"} {c.detail.role} access {c.action === "access_granted" ? "to" : "from"} {c.detail.email}
            </li>
          ))}
          {changes.length === 0 && <li className="text-muted">No changes yet.</li>}
        </ul>
      </section>
    </div>
  );
}
