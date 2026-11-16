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
const STATE_CLASS = { "no-budget": "text-muted", "on-track": "text-accent-text", "near-limit": "text-amber-600", over: "text-danger" } as const;

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

  const cards = [
    { label: "Balance", value: formatCents(totals.balance_cents), note: "all time" },
    { label: `Income ${year}`, value: formatCents(totals.income_cents), note: `of which donations ${formatCents(totals.donations_cents)}` },
    { label: `Spent ${year}`, value: formatCents(totals.expense_cents) },
    { label: "Activity budgets", value: formatCents(planned), note: `${formatCents(spentOnActivities)} spent so far` },
  ];

  return (
    <div className="space-y-5">
      <Notice code={notice} />

      <ul className="grid grid-cols-2 gap-2 @4xl:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="card !p-3">
            <span className="block text-xs font-bold uppercase tracking-wide text-muted">{card.label}</span>
            <span className="block text-xl font-bold tabular-nums">{card.value}</span>
            {card.note && <span className="block truncate text-xs text-muted">{card.note}</span>}
          </li>
        ))}
      </ul>

      <section aria-labelledby="chain-title" className={`card !p-3 text-sm ${chain.ok ? "" : "border-danger"}`}>
        <h2 id="chain-title" className="font-extrabold">{chain.ok ? "Ledger verified" : "Ledger check FAILED"}</h2>
        {chain.ok ? (
          <p className="text-muted">
            All {chain.count} entries match their fingerprints and follow each other without gaps. Latest fingerprint:{" "}
            <code className="break-all">{chain.headHash?.slice(0, 16) ?? "none yet"}</code>. Note it down in the minutes now and then: if
            entries at the very end were ever removed, it would no longer match.
          </p>
        ) : (
          <ul className="list-disc pl-5 text-danger">
            {chain.problems.map((p) => <li key={`${p.seq}-${p.problem}`}>Entry {p.seq}: {p.problem}</li>)}
            <li>Someone changed the ledger outside the app. Do not add entries; restore from a backup and find out how.</li>
          </ul>
        )}
      </section>

      <section aria-labelledby="access-title" className="card !p-3 text-sm">
        <h2 id="access-title" className="font-extrabold">Who has access</h2>
        <p className="text-muted">
          {[...env.treasurers.map((e) => `${e} (treasurer)`), ...env.auditors.map((e) => `${e} (auditor)`), ...roles.map((r) => `${r.name || r.email} (${r.role})`)].join(", ") || "Nobody."}
        </p>
        {changes.length > 0 && (
          <ul className="mt-1 text-xs text-muted">
            {changes.map((c) => (
              <li key={c.id}>{new Date(c.at).toLocaleDateString("en-GB")} · {c.actor_name} {c.action === "access_granted" ? "gave" : "removed"} {c.detail.role} access {c.action === "access_granted" ? "to" : "from"} {c.detail.email}</li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-muted">Admins manage this under Admin → Finance access. Not expecting a change? Check the list above.</p>
      </section>

      <section aria-labelledby="budgets-title">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 id="budgets-title" className="text-base font-extrabold">Activities: budget vs spent</h2>
          <form className="flex items-center gap-2 text-sm">
            <label htmlFor="year" className="text-muted">Totals for</label>
            <input id="year" name="year" type="number" min={2020} max={thisYear + 1} defaultValue={year} className="input !w-24" />
            <button className="btn btn-secondary btn-sm" type="submit">Show</button>
          </form>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Activity</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Spent</th>
                <th className="text-right">Left</th>
                <th className="text-right">Income</th>
                {access.canWrite && <th>Set budget (€)</th>}
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
                    <td className="font-medium">
                      <Link href={`/mastapps/finance/ledger?activity=${line.id}`} className="hover:text-accent-text">{line.name}</Link>
                      <span className="block text-xs font-normal text-muted">
                        {line.committee_name} · {formatDateTime(line.starts_at)}
                        {line.uses_budget && line.planned_expense_cents === 0 && <strong className="text-amber-600"> · uses the budget but none is set</strong>}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-right tabular-nums">{formatCents(line.planned_expense_cents)}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {formatCents(line.spent_cents)}
                      <span className={`block text-xs ${STATE_CLASS[status.state]}`}>{STATE_LABEL[status.state]}{status.state !== "no-budget" && ` · ${status.percentSpent}%`}</span>
                    </td>
                    <td className={`whitespace-nowrap text-right tabular-nums ${status.remainingCents < 0 ? "text-danger" : ""}`}>{line.planned_expense_cents === 0 ? "–" : formatCents(status.remainingCents)}</td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {formatCents(line.received_cents)}
                      {line.planned_income_cents > 0 && <span className="block text-xs text-muted">of {formatCents(line.planned_income_cents)}</span>}
                    </td>
                    {access.canWrite && (
                      <td>
                        <form action={setBudget} className="flex items-center gap-1">
                          <input type="hidden" name="activity_id" value={line.id} />
                          <label className="sr-only" htmlFor={`exp-${line.id}`}>Planned spending for {line.name}</label>
                          <input id={`exp-${line.id}`} name="planned_expense" inputMode="decimal" className="input !w-24" placeholder={suggestion ? centsToDecimal(suggestion) : "0,00"} defaultValue={line.planned_expense_cents ? centsToDecimal(line.planned_expense_cents) : ""} title="Planned spending" />
                          <label className="sr-only" htmlFor={`inc-${line.id}`}>Planned income for {line.name}</label>
                          <input id={`inc-${line.id}`} name="planned_income" inputMode="decimal" className="input !w-24" placeholder="income" defaultValue={line.planned_income_cents ? centsToDecimal(line.planned_income_cents) : ""} title="Planned income" />
                          <button className="btn btn-secondary btn-sm" type="submit">Save</button>
                        </form>
                      </td>
                    )}
                  </tr>
                );
              })}
              <tr className="font-bold">
                <td>Not tied to an activity</td>
                <td />
                <td className="text-right tabular-nums">{formatCents(unassigned.expense_cents)}</td>
                <td />
                <td className="text-right tabular-nums">{formatCents(unassigned.income_cents)}</td>
                {access.canWrite && <td />}
              </tr>
              {lines.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-muted">No activities yet.</td></tr>}
            </tbody>
          </table>
        </div>
        {access.canWrite && <p className="mt-2 text-xs text-muted">The grey hint in the first box is cost per person × expected attendees from the activity. Every budget change is logged.</p>}
      </section>
    </div>
  );
}
