import Link from "next/link";
import { CATEGORIES, categoryLabel, getCategoryTotals, getMonthlyTotals, getTotals, listEntries, verifyChain } from "@/lib/finance";
import { envFinanceEmails } from "@/lib/finance-access";
import { formatCents } from "@/lib/finance-money";
import { listRoles, recentAccessChanges } from "@/lib/finance-roles";
import { formatDate } from "@/lib/news";

const monthName = (month: number) => new Date(2000, month - 1, 1).toLocaleString("en-GB", { month: "long" });
const negative = (cents: number) => (cents < 0 ? "text-danger" : "");

export default async function OverviewView({ year }: { year: number }) {
  const [totals, byCategory, monthly, recent, chain, roles, changes] = await Promise.all([
    getTotals(year), getCategoryTotals(year), getMonthlyTotals(year), listEntries({}, 1), verifyChain(), listRoles(), recentAccessChanges(5),
  ]);
  const env = envFinanceEmails();
  const accessList = [
    ...env.treasurers.map((e) => `${e} (treasurer)`),
    ...env.auditors.map((e) => `${e} (auditor)`),
    ...roles.map((r) => `${r.name || r.email} (${r.role})`),
  ];

  const incomeRows = CATEGORIES.map((c) => ({ label: c.label, cents: byCategory.find((t) => t.category === c.value)?.income_cents ?? 0 })).filter((r) => r.cents > 0);
  const expenseRows = CATEGORIES.map((c) => ({ label: c.label, cents: byCategory.find((t) => t.category === c.value)?.expense_cents ?? 0 })).filter((r) => r.cents > 0);
  const result = totals.income_cents - totals.expense_cents;
  const share = (cents: number, of: number) => (of > 0 ? `${Math.round((cents / of) * 100)}%` : "");

  return (
    <div className="space-y-8">
      <ul className="stat-strip stat-strip--4">
        <li>
          <span className="stat-strip__label">Balance</span>
          <span className="stat-strip__value">{formatCents(totals.balance_cents)}</span>
          <span className="stat-strip__note">all time · {totals.entry_count} entries</span>
        </li>
        <li>
          <span className="stat-strip__label">Income {year}</span>
          <span className="stat-strip__value">{formatCents(totals.income_cents)}</span>
          <span className="stat-strip__note">donations {formatCents(totals.donations_cents)}</span>
        </li>
        <li>
          <span className="stat-strip__label">Expenditure {year}</span>
          <span className="stat-strip__value">{formatCents(totals.expense_cents)}</span>
          <span className="stat-strip__note">&nbsp;</span>
        </li>
        <li>
          <span className="stat-strip__label">Result {year}</span>
          <span className={`stat-strip__value ${negative(result)}`}>{formatCents(result)}</span>
          <span className="stat-strip__note">{result < 0 ? "deficit" : "surplus"}</span>
        </li>
      </ul>

      <div className="grid gap-8 @4xl:grid-cols-2">
        <section aria-labelledby="statement-title">
          <div className="section-head">
            <h2 id="statement-title">Income and expenditure {year}</h2>
          </div>
          <div className="table-wrap">
            <table className="ledger-table">
              <tbody>
                <tr className="is-section"><td>Income</td><td /><td /></tr>
                {incomeRows.map((r) => (
                  <tr key={r.label} className="is-line"><td>{r.label}</td><td>{formatCents(r.cents)}</td><td className="is-muted">{share(r.cents, totals.income_cents)}</td></tr>
                ))}
                {incomeRows.length === 0 && <tr className="is-line is-muted"><td colSpan={3}>No income booked.</td></tr>}
                <tr className="is-total"><td>Total income</td><td>{formatCents(totals.income_cents)}</td><td /></tr>

                <tr className="is-section"><td>Expenditure</td><td /><td /></tr>
                {expenseRows.map((r) => (
                  <tr key={r.label} className="is-line"><td>{r.label}</td><td>{formatCents(r.cents)}</td><td className="is-muted">{share(r.cents, totals.expense_cents)}</td></tr>
                ))}
                {expenseRows.length === 0 && <tr className="is-line is-muted"><td colSpan={3}>No expenditure booked.</td></tr>}
                <tr className="is-total"><td>Total expenditure</td><td>{formatCents(totals.expense_cents)}</td><td /></tr>

                <tr className="is-grand"><td>Result for {year}</td><td className={negative(result)}>{formatCents(result)}</td><td /></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section aria-labelledby="monthly-title">
          <div className="section-head">
            <h2 id="monthly-title">By month</h2>
          </div>
          <div className="table-wrap">
            <table className="ledger-table">
              <thead>
                <tr className="is-muted"><th>Month</th><th>Income</th><th>Expenditure</th><th>Result</th></tr>
              </thead>
              <tbody>
                {monthly.map((m) => {
                  const net = m.income_cents - m.expense_cents;
                  const empty = m.income_cents === 0 && m.expense_cents === 0;
                  return (
                    <tr key={m.month} className={empty ? "is-muted" : undefined}>
                      <td>{monthName(m.month)}</td>
                      <td>{empty ? "–" : formatCents(m.income_cents)}</td>
                      <td>{empty ? "–" : formatCents(m.expense_cents)}</td>
                      <td className={negative(net)}>{empty ? "–" : formatCents(net)}</td>
                    </tr>
                  );
                })}
                <tr className="is-total">
                  <td>Total</td>
                  <td>{formatCents(totals.income_cents)}</td>
                  <td>{formatCents(totals.expense_cents)}</td>
                  <td className={negative(result)}>{formatCents(result)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section aria-labelledby="recent-title">
        <div className="section-head">
          <h2 id="recent-title">Latest mutations</h2>
          <Link href="/mastapps/finance?view=mutations" className="text-sm font-medium text-accent-text hover:underline">Open the mutations</Link>
        </div>
        <div className="table-wrap">
          <table className="ledger-table">
            <tbody>
              {recent.entries.slice(0, 8).map((e) => (
                <tr key={e.id} className={e.reversed_by_id ? "is-muted line-through" : undefined}>
                  <td>
                    <span className="font-medium">{e.description}</span>
                    <span className="block text-xs font-normal text-muted">{formatDate(e.occurred_on)} · {categoryLabel(e.category)}{e.counterparty && ` · ${e.counterparty}`}</span>
                  </td>
                  <td className={e.amount_cents < 0 ? "" : "text-accent-text"}>{formatCents(e.amount_cents)}</td>
                </tr>
              ))}
              {recent.entries.length === 0 && <tr className="is-muted"><td colSpan={2}>Nothing booked yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Books integrity and access" className="card divide-y divide-line !p-0 text-sm">
        <details open={!chain.ok}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
            <span className="flex items-center gap-2 font-medium">
              <span aria-hidden className={`inline-block size-2 rounded-full ${chain.ok ? "bg-success" : "bg-danger"}`} />
              {chain.ok ? `Books verified · ${chain.count} sealed mutations` : "Books check failed"}
            </span>
            <span className="text-xs text-muted">Details</span>
          </summary>
          <div className="px-4 pb-3 text-muted">
            {chain.ok ? (
              <p>
                Every entry matches its fingerprint and follows the previous one without gaps. Latest fingerprint:{" "}
                <code className="break-all">{chain.headHash?.slice(0, 16) ?? "none yet"}</code>. Note it in the minutes now and then: if
                entries at the very end were ever removed, it would no longer match.
              </p>
            ) : (
              <ul className="list-disc pl-5 text-danger">
                {chain.problems.map((p) => <li key={`${p.seq}-${p.problem}`}>Entry {p.seq}: {p.problem}</li>)}
                <li>Someone changed the books outside the app. Do not add mutations; restore from a backup and find out how.</li>
              </ul>
            )}
          </div>
        </details>
        <details>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
            <span className="font-medium">Access · {accessList.length} {accessList.length === 1 ? "person" : "people"}</span>
            <span className="text-xs text-muted">Details</span>
          </summary>
          <div className="space-y-2 px-4 pb-3 text-muted">
            <p>{accessList.join(", ") || "Nobody."}</p>
            {changes.length > 0 && (
              <ul className="text-xs">
                {changes.map((c) => (
                  <li key={c.id}>{new Date(c.at).toLocaleDateString("en-GB")} · {c.actor_name} {c.action === "access_granted" ? "gave" : "removed"} {c.detail.role} access {c.action === "access_granted" ? "to" : "from"} {c.detail.email}</li>
                ))}
              </ul>
            )}
            <p className="text-xs">Admins manage this under Admin → Finance access.</p>
          </div>
        </details>
      </section>
    </div>
  );
}
