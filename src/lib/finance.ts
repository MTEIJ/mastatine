import sql from "@/lib/db";
import type { FinanceAccess } from "@/lib/finance-access";

/** Who did it: a finance user, or an admin managing access. */
type Actor = Pick<FinanceAccess, "userId" | "name">;

export const CATEGORIES = [
  { value: "donation", label: "Donation", direction: "in" },
  { value: "membership", label: "Membership fee", direction: "in" },
  { value: "sponsorship", label: "Sponsorship", direction: "in" },
  { value: "merch", label: "Merch", direction: "in" },
  { value: "activity_income", label: "Activity income", direction: "in" },
  { value: "activity_cost", label: "Activity cost", direction: "out" },
  { value: "supplies", label: "Supplies", direction: "out" },
  { value: "fees", label: "Fees and charges", direction: "out" },
  { value: "other", label: "Other", direction: "either" },
] as const;

export type Category = (typeof CATEGORIES)[number]["value"];
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];
export const categoryLabel = (value: string): string => CATEGORIES.find((c) => c.value === value)?.label ?? value;

export interface Entry {
  id: string;
  seq: number;
  occurred_on: string;
  amount_cents: number;
  category: Category;
  counterparty: string;
  description: string;
  activity_id: string | null;
  activity_label: string;
  reverses_id: string | null;
  reversed_by_id: string | null;
  created_by_name: string;
  created_at: Date;
  receipts: { id: string; original_name: string }[];
}

export interface EntryFilters {
  year?: number;
  category?: Category;
  activityId?: string;
}

const PAGE_SIZE = 50;

/** Ledger rows, newest first, with their receipts and whether they were reversed. Bigints arrive as strings, so cast. */
export async function listEntries(filters: EntryFilters, page: number): Promise<{ entries: Entry[]; hasMore: boolean }> {
  const where = [
    filters.year ? sql`e.occurred_on >= make_date(${filters.year}, 1, 1) AND e.occurred_on < make_date(${filters.year + 1}, 1, 1)` : sql`TRUE`,
    filters.category ? sql`e.category = ${filters.category}` : sql`TRUE`,
    filters.activityId ? sql`e.activity_id = ${filters.activityId}` : sql`TRUE`,
  ].reduce((all, clause) => sql`${all} AND ${clause}`);

  const rows = await sql<Entry[]>`
    SELECT e.id, e.seq::float8, to_char(e.occurred_on, 'YYYY-MM-DD') AS occurred_on, e.amount_cents::float8, e.category, e.counterparty,
      e.description, e.activity_id, e.activity_label, e.reverses_id, e.created_by_name, e.created_at,
      (SELECT r.id FROM finance_entries r WHERE r.reverses_id = e.id) AS reversed_by_id,
      COALESCE((SELECT json_agg(json_build_object('id', f.id, 'original_name', f.original_name) ORDER BY f.created_at)
                FROM finance_receipts f WHERE f.entry_id = e.id), '[]'::json) AS receipts
    FROM finance_entries e WHERE ${where}
    ORDER BY e.occurred_on DESC, e.seq DESC LIMIT ${PAGE_SIZE + 1} OFFSET ${(page - 1) * PAGE_SIZE}
  `;
  return { entries: rows.slice(0, PAGE_SIZE), hasMore: rows.length > PAGE_SIZE };
}

export interface Totals {
  balance_cents: number;
  income_cents: number;
  expense_cents: number;
  donations_cents: number;
  entry_count: number;
}

/**
 * Every entry with a `live` flag: false for a reversal and for the entry it cancelled. Income and spending ignore dead
 * pairs (a reversed expense is neither spent nor income), while the balance sums everything, which nets to the same.
 */
function withLive() {
  return sql`
    SELECT f.*, (f.reverses_id IS NULL AND NOT EXISTS (SELECT 1 FROM finance_entries r WHERE r.reverses_id = f.id)) AS live
    FROM finance_entries f
  `;
}

/** Totals for a calendar year, plus the all-time balance. */
export async function getTotals(year: number): Promise<Totals> {
  const [row] = await sql<Totals[]>`
    WITH e AS (${withLive()})
    SELECT
      COALESCE(SUM(amount_cents), 0)::float8 AS balance_cents,
      COALESCE(SUM(amount_cents) FILTER (WHERE live AND amount_cents > 0 AND occurred_on >= make_date(${year}, 1, 1) AND occurred_on < make_date(${year + 1}, 1, 1)), 0)::float8 AS income_cents,
      COALESCE(-SUM(amount_cents) FILTER (WHERE live AND amount_cents < 0 AND occurred_on >= make_date(${year}, 1, 1) AND occurred_on < make_date(${year + 1}, 1, 1)), 0)::float8 AS expense_cents,
      COALESCE(SUM(amount_cents) FILTER (WHERE live AND category = 'donation' AND occurred_on >= make_date(${year}, 1, 1) AND occurred_on < make_date(${year + 1}, 1, 1)), 0)::float8 AS donations_cents,
      COUNT(*)::int AS entry_count
    FROM e
  `;
  return row;
}

export interface ActivityLine {
  id: string;
  name: string;
  starts_at: Date;
  committee_name: string;
  uses_budget: boolean;
  cost_cents: number | null;
  estimated_attendees: number | null;
  planned_expense_cents: number;
  planned_income_cents: number;
  spent_cents: number;
  received_cents: number;
}

/** Every activity from the last year onwards with what was planned and what actually moved. */
export async function getActivityLines(): Promise<ActivityLine[]> {
  return sql<ActivityLine[]>`
    WITH e AS (${withLive()})
    SELECT a.id, a.name, a.starts_at, c.name AS committee_name, a.uses_budget, a.cost_cents, a.estimated_attendees,
      COALESCE(b.planned_expense_cents, 0)::float8 AS planned_expense_cents,
      COALESCE(b.planned_income_cents, 0)::float8 AS planned_income_cents,
      COALESCE(-SUM(e.amount_cents) FILTER (WHERE e.live AND e.amount_cents < 0), 0)::float8 AS spent_cents,
      COALESCE(SUM(e.amount_cents) FILTER (WHERE e.live AND e.amount_cents > 0), 0)::float8 AS received_cents
    FROM activities a
    JOIN committees c ON c.id = a.committee_id
    LEFT JOIN activity_budgets b ON b.activity_id = a.id
    LEFT JOIN e ON e.activity_id = a.id
    WHERE a.starts_at > NOW() - INTERVAL '1 year' OR e.id IS NOT NULL OR b.activity_id IS NOT NULL
    GROUP BY a.id, c.name, b.planned_expense_cents, b.planned_income_cents
    ORDER BY a.starts_at DESC
  `;
}

/** Money not tied to any activity (donations, fees, supplies), as in and out. */
export async function getUnassigned(): Promise<{ income_cents: number; expense_cents: number }> {
  const [row] = await sql<{ income_cents: number; expense_cents: number }[]>`
    WITH e AS (${withLive()})
    SELECT COALESCE(SUM(amount_cents) FILTER (WHERE amount_cents > 0), 0)::float8 AS income_cents,
      COALESCE(-SUM(amount_cents) FILTER (WHERE amount_cents < 0), 0)::float8 AS expense_cents
    FROM e WHERE activity_id IS NULL AND live
  `;
  return row;
}

export interface ChainReport {
  ok: boolean;
  count: number;
  headHash: string | null;
  problems: { seq: number; problem: string }[];
}

/** Re-computes every hash and link. Detects edited rows, deleted rows in the middle and broken links. */
export async function verifyChain(): Promise<ChainReport> {
  const rows = await sql<{ seq: number; hash_ok: boolean; link_ok: boolean; gap: boolean; entry_hash: string }[]>`
    SELECT e.seq::int, e.entry_hash,
      e.entry_hash = finance_entry_hash(e) AS hash_ok,
      e.prev_hash = COALESCE(LAG(e.entry_hash) OVER (ORDER BY e.seq), repeat('0', 64)) AS link_ok,
      e.seq <> COALESCE(LAG(e.seq) OVER (ORDER BY e.seq), 0) + 1 AS gap
    FROM finance_entries e ORDER BY e.seq
  `;
  const problems = rows.flatMap((r) => [
    ...(r.hash_ok ? [] : [{ seq: r.seq, problem: "content does not match its hash" }]),
    ...(r.link_ok ? [] : [{ seq: r.seq, problem: "does not follow the previous entry" }]),
    ...(r.gap ? [{ seq: r.seq, problem: "an entry before this one is missing" }] : []),
  ]);
  return { ok: problems.length === 0, count: rows.length, headHash: rows.at(-1)?.entry_hash ?? null, problems };
}

/** Who did what. Written for budget changes and exports; the ledger itself records who added each entry. */
export async function logAudit(actor: Actor, action: string, detail: Record<string, unknown> = {}): Promise<void> {
  await sql`INSERT INTO finance_audit (actor_id, actor_name, action, detail) VALUES (${actor.userId}, ${actor.name}, ${action}, ${sql.json(JSON.parse(JSON.stringify(detail)))})`;
}

export async function listActivityOptions(): Promise<{ id: string; name: string; starts_at: Date }[]> {
  return sql`SELECT id, name, starts_at FROM activities WHERE starts_at > NOW() - INTERVAL '1 year' ORDER BY starts_at DESC LIMIT 200`;
}

export interface CategoryTotal {
  category: Category;
  income_cents: number;
  expense_cents: number;
}

export interface MonthTotal {
  month: number;
  income_cents: number;
  expense_cents: number;
}

/** Income and spending per category for a calendar year, ignoring reversed pairs. */
export async function getCategoryTotals(year: number): Promise<CategoryTotal[]> {
  return sql<CategoryTotal[]>`
    WITH e AS (${withLive()})
    SELECT category,
      COALESCE(SUM(amount_cents) FILTER (WHERE amount_cents > 0), 0)::float8 AS income_cents,
      COALESCE(-SUM(amount_cents) FILTER (WHERE amount_cents < 0), 0)::float8 AS expense_cents
    FROM e
    WHERE live AND occurred_on >= make_date(${year}, 1, 1) AND occurred_on < make_date(${year + 1}, 1, 1)
    GROUP BY category
  `;
}

/** Income and spending per month (1 to 12) of a calendar year; months without entries are included as zero. */
export async function getMonthlyTotals(year: number): Promise<MonthTotal[]> {
  return sql<MonthTotal[]>`
    WITH e AS (${withLive()})
    SELECT m.month::int AS month,
      COALESCE(SUM(e.amount_cents) FILTER (WHERE e.amount_cents > 0), 0)::float8 AS income_cents,
      COALESCE(-SUM(e.amount_cents) FILTER (WHERE e.amount_cents < 0), 0)::float8 AS expense_cents
    FROM generate_series(1, 12) AS m(month)
    LEFT JOIN e ON e.live AND EXTRACT(MONTH FROM e.occurred_on) = m.month
      AND e.occurred_on >= make_date(${year}, 1, 1) AND e.occurred_on < make_date(${year + 1}, 1, 1)
    GROUP BY m.month ORDER BY m.month
  `;
}
