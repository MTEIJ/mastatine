import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/datetime";
import { getActivityLines, getUnassigned } from "@/lib/finance";
import type { FinanceAccess } from "@/lib/finance-access";
import { budgetStatus, centsToDecimal, formatCents, suggestedExpenseCents } from "@/lib/finance-money";
import { setBudget } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { buttonClass } from "@/components/ui/classes";

const STATE_LABEL = { "no-budget": "No budget", "on-track": "On track", "near-limit": "Near limit", over: "Over budget" } as const;
const STATE_CLASS = { "no-budget": "text-muted", "on-track": "text-accent-text", "near-limit": "text-warning", over: "text-danger" } as const;

export default async function BudgetsView({ access }: { access: FinanceAccess }) {
  const [lines, unassigned] = await Promise.all([getActivityLines(), getUnassigned()]);
  const planned = lines.reduce((sum, l) => sum + l.planned_expense_cents, 0);
  const spent = lines.reduce((sum, l) => sum + l.spent_cents, 0);
  const plannedIncome = lines.reduce((sum, l) => sum + l.planned_income_cents, 0);
  const received = lines.reduce((sum, l) => sum + l.received_cents, 0);

  return (
    <div className="space-y-6">
      <ul className="stat-strip stat-strip--4">
        <li><span className="stat-strip__label">Budgeted spending</span><span className="stat-strip__value">{formatCents(planned)}</span><span className="stat-strip__note">across {lines.length} activities</span></li>
        <li><span className="stat-strip__label">Spent so far</span><span className="stat-strip__value">{formatCents(spent)}</span><span className="stat-strip__note">{planned > 0 ? `${Math.round((spent / planned) * 100)}% of budget` : " "}</span></li>
        <li><span className="stat-strip__label">Expected income</span><span className="stat-strip__value">{formatCents(plannedIncome)}</span><span className="stat-strip__note">&nbsp;</span></li>
        <li><span className="stat-strip__label">Received</span><span className="stat-strip__value">{formatCents(received)}</span><span className="stat-strip__note">&nbsp;</span></li>
      </ul>

      <section aria-labelledby="budgets-title">
        <div className="section-head">
          <div>
            <h2 id="budgets-title">Activity budgets</h2>
            <p>Planned against actual, per activity. Every budget change is logged.</p>
          </div>
        </div>

        <div className="table-wrap">
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
                      <Link href={`/mastapps/finance?view=mutations&activity=${line.id}`} className="hover:text-accent-text">{line.name}</Link>
                      <span className="block text-xs font-normal text-muted">
                        {line.committee_name} · {formatDateTime(line.starts_at)}
                        {line.uses_budget && line.planned_expense_cents === 0 && <strong className="font-medium text-warning"> · budget not set</strong>}
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
                        <Modal label="Set budget" triggerLabel={`Set budget for ${line.name}`} title="Set budget" description={line.name} triggerClassName={buttonClass({ variant: "secondary", size: "sm" }, "max-sm:w-full")}>
                          <form action={setBudget} className="space-y-3">
                            <input type="hidden" name="activity_id" value={line.id} />
                            <div>
                              <Label htmlFor={`exp-${line.id}`}>Planned spending (€)</Label>
                              <Input id={`exp-${line.id}`} name="planned_expense" inputMode="decimal" placeholder={suggestion ? centsToDecimal(suggestion) : "0,00"} defaultValue={line.planned_expense_cents ? centsToDecimal(line.planned_expense_cents) : ""} />
                              {suggestion != null && suggestion > 0 && <p className="mt-1 text-xs text-muted">Suggestion {formatCents(suggestion)}: cost per person × expected attendees.</p>}
                            </div>
                            <div>
                              <Label htmlFor={`inc-${line.id}`}>Planned income (€)</Label>
                              <Input id={`inc-${line.id}`} name="planned_income" inputMode="decimal" placeholder="0,00" defaultValue={line.planned_income_cents ? centsToDecimal(line.planned_income_cents) : ""} />
                            </div>
                            <Button variant="primary" type="submit">Save budget</Button>
                          </form>
                        </Modal>
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
      </section>
    </div>
  );
}
