/** Money is always whole cents (integers), never floating point. */

const AMOUNT_RE = /^\d{1,9}(?:[.,]\d{1,2})?$/;

/** "12", "12.5" and "12,50" become 1200, 1250 and 1250 cents; anything else (signs, thousands separators, text) is null. */
export function parseEuroToCents(input: string): number | null {
  const text = input.trim().replace(/^€\s*/, "");
  if (!AMOUNT_RE.test(text)) return null;
  const [whole, fraction = ""] = text.split(/[.,]/);
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

const euro = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

/** 123456 -> "€ 1.234,56". Negative amounts keep their minus sign. */
export function formatCents(cents: number): string {
  return euro.format(cents / 100);
}

/** The amount as a plain decimal for CSV and form fields: 123456 -> "1234.56". */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export interface BudgetFigures {
  plannedExpenseCents: number;
  plannedIncomeCents: number;
  /** Money spent so far, as a positive number. */
  spentCents: number;
  receivedCents: number;
}

export type BudgetState = "no-budget" | "on-track" | "near-limit" | "over";

export interface BudgetStatus {
  remainingCents: number;
  /** 0 to 100 for the progress bar; the real overspend is in `remainingCents`. */
  percentSpent: number;
  netCents: number;
  state: BudgetState;
}

/** How an activity stands against its budget. Near the limit starts at 85% of the planned spend. */
export function budgetStatus({ plannedExpenseCents, spentCents, receivedCents }: BudgetFigures): BudgetStatus {
  const netCents = receivedCents - spentCents;
  const remainingCents = plannedExpenseCents - spentCents;
  if (plannedExpenseCents === 0) {
    return { remainingCents, percentSpent: spentCents > 0 ? 100 : 0, netCents, state: spentCents > 0 ? "over" : "no-budget" };
  }
  const ratio = spentCents / plannedExpenseCents;
  const state: BudgetState = ratio > 1 ? "over" : ratio >= 0.85 ? "near-limit" : "on-track";
  return { remainingCents, percentSpent: Math.min(100, Math.round(ratio * 100)), netCents, state };
}

/** Suggested spend for an activity: cost per person times the expected attendees, when both are known. */
export function suggestedExpenseCents(costCents: number | null, estimatedAttendees: number | null): number | null {
  if (costCents == null || estimatedAttendees == null || costCents === 0 || estimatedAttendees === 0) return null;
  return costCents * estimatedAttendees;
}
