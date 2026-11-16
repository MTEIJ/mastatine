import Link from "next/link";
import { formatDateTime } from "@/lib/datetime";
import { getActivityLines, getTotals, getUnassigned, verifyChain } from "@/lib/finance";
import { envFinanceEmails, requireFinance } from "@/lib/finance-access";
import { listRoles, recentAccessChanges } from "@/lib/finance-roles";
import { budgetStatus, centsToDecimal, formatCents, suggestedExpenseCents } from "@/lib/finance-money";
import Notice from "./notices";
import { setBudget } from "./actions";

export const instant = false;

const STATE_LABEL = { "no-budget": "No budget", "on-track": "On track", "near-limit": "Near limit", over: "Over budget" } as const;
const STATE_CLASS = { "no-budget": "text-muted", "on-track": "text-accent-text", "near-limit": "text-amber-700", over: "text-danger" } as const;

export default async function FinanceOverview(props: { searchParams: Promise<{ notice?: string; year?: string }> }) {
  // Layouts do not re-run on client navigation, so each page checks access itself.
  const access = await requireFinance();
  const { notice, year: yearParam } = await props.searchParams;
  const thisYear = new Date().getFullYear();
  const year = Math.min(thisYear + 1, Math.max(2020, Number(yearParam) || thisYear));

  const [totals, lines, unassigned, chain, roles, changes] = await Promise.all([
    getTotals(year), getActivityLines(), getUnassigned(), verifyChain(), listRoles(), recentAccessChanges(5),
  ]);
  const env = envFinanceEmails();
  const planned = lines.reduce((sum, l) => sum + l.planned_expense_cents, 0);
  const spentOnActivities = lines.reduce((sum, l) => sum + l.spent_cents, 0);
  const accessList = [
    ...env.treasurers.map((e) => `${e} (treasurer)`),
    ...env.auditors.map((e) => `${e} (auditor)`),
    ...roles.map((r) => `${r.name || r.email} (${r.role})`),
  ];

  const cards = [
    { label: "Balance", value: formatCents(totals.balance_cents), note: "all time" },
    { label: `Income ${year}`, value: formatCents(totals.income_cents), note: `of which donations ${formatCents(totals.donations_cents)}` },
    { label: `Spent ${year}`, value: formatCents(totals.expense_cents), note: "" },
    { label: "Activity budgets", value: formatCents(planned), note: `${formatCents(spentOnActivities)} spent so far` },
  ];

  return (
    <div className="space-y-8">
      <Notice code={notice} />

      <ul className="stat-strip stat-strip--4">
        {cards.map((card) => (
          <li key={card.label}>
            <span className="stat-strip__label">{card.label}</span>
            <span className="stat-strip__value">{card.value}</span>
            <span className="stat-strip__note">{card.note || " "}</span>
          </li>
        ))}
      </ul>

      <section aria-labelledby="budgets-title">
        <div className="section-head">
          <div>
            <h2 id="budgets-title">Activity budgets</h2>
            <p>Budget against what has been spent.</p>
          </div>
          <form className="flex items-center gap-2 text-sm">
            <label htmlFor="year" className="text-muted">Year</label>
            <input id="year" name="year" type="number" min={2020} max={thisYear + 1} defaultValue={year} className="input !w-20" />
            <button className="btn btn-secondary btn-sm" type="submit">Show</button>
          </form>
        </div>

        {/* Not .table-wrap: the budget popover has to hang below its row. */}
        <div className="table-open">
          <table className="table table-stack">
            <thead>
              <tr>
                <th>Activity</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Spent</th>
                <th className="text-right">Left</th>
                <th className="text-right">Income</th>
                {access.canWrite && <th><span className="sr-only">Edit budget</span></th>}
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => {
                const status = budgetStatus({
                  plannedExpenseCents: line.planned_expense_cents,
                  plannedIncomeCents: line.planned_income_cents,
                  spentCents: line.spent_cents,
                  receivedCents: line.received_cents,
                });
                const suggestion = suggestedExpenseCents(line.cost_cents, line.estimated_attendees);
                return (
                  <tr key={line.id}>
                    <td data-primary className="font-medium">
                      <Link href={`/mastapps/finance/ledger?activity=${line.id}`} className="hover:text-accent-text">{line.name}</Link>
                      <span className="block text-xs font-normal text-muted">
                        {line.committee_name} · {formatDateTime(line.starts_at)}
                        {line.uses_budget && line.planned_expense_cents === 0 && <strong className="font-medium text-amber-700"> · budget not set</strong>}
                      </span>
                    </td>
                    <td data-label="Budget" className="whitespace-nowrap text-right tabular-nums">{line.planned_expense_cents === 0 ? "–" : formatCents(line.planned_expense_cents)}</td>
                    <td data-label="Spent" className="whitespace-nowrap text-right tabular-nums">
                      {formatCents(line.spent_cents)}
                      {status.state !== "no-budget" && (
                        <span className={`block text-xs ${STATE_CLASS[status.state]}`}>{STATE_LABEL[status.state]} · {status.percentSpent}%</span>
                      )}
                    </td>
                    <td data-label="Left" className={`whitespace-nowrap text-right tabular-nums ${status.remainingCents < 0 ? "text-danger" : ""}`}>{line.planned_expense_cents === 0 ? "–" : formatCents(status.remainingCents)}</td>
                    <td data-label="Income" className="whitespace-nowrap text-right tabular-nums">
                      {formatCents(line.received_cents)}
                      {line.planned_income_cents > 0 && <span className="block text-xs text-muted">of {formatCents(line.planned_income_cents)}</span>}
                    </td>
                    {access.canWrite && (
                      <td>
                        <details className="popover max-sm:w-full">
                          <summary className="btn btn-secondary btn-sm max-sm:w-full" aria-label={`Set budget for ${line.name}`}>Set budget</summary>
                          <form action={setBudget} className="popover__panel space-y-2 text-sm">
                            <input type="hidden" name="activity_id" value={line.id} />
                            <div>
                              <label className="label" htmlFor={`exp-${line.id}`}>Planned spending (€)</label>
                              <input id={`exp-${line.id}`} name="planned_expense" inputMode="decimal" className="input" placeholder={suggestion ? centsToDecimal(suggestion) : "0,00"} defaultValue={line.planned_expense_cents ? centsToDecimal(line.planned_expense_cents) : ""} />
                              {suggestion && suggestion > 0 && <p className="mt-1 text-xs text-muted">Suggestion: {formatCents(suggestion)} (cost per person × expected attendees)</p>}
                            </div>
                            <div>
                              <label className="label" htmlFor={`inc-${line.id}`}>Planned income (€)</label>
                              <input id={`inc-${line.id}`} name="planned_income" inputMode="decimal" className="input" placeholder="0,00" defaultValue={line.planned_income_cents ? centsToDecimal(line.planned_income_cents) : ""} />
                            </div>
                            <button className="btn btn-primary btn-sm" type="submit">Save budget</button>
                          </form>
                        </details>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td data-primary>Not tied to an activity</td>
                <td className="max-sm:hidden" />
                <td data-label="Spent" className="text-right tabular-nums">{formatCents(unassigned.expense_cents)}</td>
                <td className="max-sm:hidden" />
                <td data-label="Income" className="text-right tabular-nums">{formatCents(unassigned.income_cents)}</td>
                {access.canWrite && <td className="max-sm:hidden" />}
              </tr>
              {lines.length === 0 && <tr><td colSpan={6} className="py-6 text-center text-muted">No activities yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {access.canWrite && <p className="mt-2 text-xs text-muted">Every budget change is logged.</p>}
      </section>

      <section aria-label="Ledger and access" className="card divide-y divide-line !p-0 text-sm">
        <details open={!chain.ok}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5">
            <span className="flex items-center gap-2 font-medium">
              <span aria-hidden className={`inline-block size-2 rounded-full ${chain.ok ? "bg-accent" : "bg-danger"}`} />
              {chain.ok ? `Ledger verified · ${chain.count} entries` : "Ledger check failed"}
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
                <li>Someone changed the ledger outside the app. Do not add entries; restore from a backup and find out how.</li>
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
