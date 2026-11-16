"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import sql from "@/lib/db";
import { CATEGORIES, CATEGORY_VALUES, logAudit } from "@/lib/finance";
import { requireFinance } from "@/lib/finance-access";
import { parseEuroToCents } from "@/lib/finance-money";

const HOME = "/mastapps/finance";
const LEDGER = "/mastapps/finance?view=mutations";
const BUDGETS = "/mastapps/finance?view=budgets";
const YEARS = "/mastapps/finance?view=years";

const id = z.uuid();
const optionalId = z.preprocess((v) => (v === "" ? undefined : v), z.uuid().optional());

const entrySchema = z.object({
  direction: z.enum(["in", "out"]),
  amount: z.string().transform((v, ctx) => {
    const cents = parseEuroToCents(v);
    if (cents == null || cents === 0) ctx.addIssue({ code: "custom", message: "amount" });
    return cents ?? 0;
  }),
  occurred_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(CATEGORY_VALUES),
  counterparty: z.string().trim().max(120),
  description: z.string().trim().min(1).max(300),
  activity_id: optionalId,
});

function fail(notice: string): never {
  redirect(`${LEDGER}&notice=${notice}`);
}

/** A date that exists and is not in the far future (typos like 2062 are caught here, not in the books). */
function isSensibleDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  const limit = Date.now() + 7 * 86_400_000;
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value) && date.getTime() <= limit && date.getUTCFullYear() >= 2020;
}

interface ParsedEntry {
  occurred_on: string;
  amount_cents: number;
  category: string;
  counterparty: string;
  description: string;
  activity_id: string | null;
  activity_label: string;
}

/** Validates the entry form shared by "add" and "edit": every rule in one place, so an edit cannot sneak past a check. */
async function parseEntryForm(formData: FormData): Promise<ParsedEntry> {
  const parsed = entrySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !isSensibleDate(parsed.data.occurred_on)) fail("invalid");
  const data = parsed.data;

  // Money in must use an income category and money out a cost category, so a typo cannot flip the books.
  const category = CATEGORIES.find((c) => c.value === data.category)!;
  if (category.direction !== "either" && category.direction !== data.direction) fail("category-direction");

  let activityLabel = "";
  if (data.activity_id) {
    const [activity] = await sql<{ name: string }[]>`SELECT name FROM activities WHERE id = ${data.activity_id}`;
    if (!activity) fail("invalid");
    activityLabel = activity.name;
  }

  return {
    occurred_on: data.occurred_on,
    amount_cents: data.direction === "in" ? data.amount : -data.amount,
    category: data.category,
    counterparty: data.counterparty,
    description: data.description,
    activity_id: data.activity_id ?? null,
    activity_label: activityLabel,
  };
}

export async function addEntry(formData: FormData) {
  const actor = await requireFinance("write");
  const e = await parseEntryForm(formData);
  try {
    await sql`
      INSERT INTO finance_entries (occurred_on, amount_cents, category, counterparty, description, activity_id, activity_label, created_by_id, created_by_name)
      VALUES (${e.occurred_on}, ${e.amount_cents}, ${e.category}, ${e.counterparty}, ${e.description}, ${e.activity_id}, ${e.activity_label}, ${actor.userId}, ${actor.name})
    `;
  } catch (error) {
    if ((error as { code?: string }).code === "23000") fail("year-closed");
    throw error;
  }
  revalidatePath(HOME, "layout");
  redirect(`${LEDGER}&notice=added`);
}

const snapshotColumns = () => sql`to_char(occurred_on, 'YYYY-MM-DD') AS occurred_on, amount_cents::float8, category, counterparty, description, activity_label`;

/** A mutation that is still open (the database enforces this too): not sealed, not a reversal. */
async function findOpenEntry(entryId: string) {
  const [row] = await sql<ParsedEntry[]>`
    SELECT ${snapshotColumns()}, activity_id FROM finance_entries
    WHERE id = ${entryId} AND seq IS NULL AND reverses_id IS NULL
  `;
  return row;
}

/** Corrects an open entry. The old and new values are written to the audit log. */
export async function updateEntry(formData: FormData) {
  const actor = await requireFinance("write");
  const entryId = id.safeParse(formData.get("id"));
  if (!entryId.success) fail("invalid");
  const before = await findOpenEntry(entryId.data);
  if (!before) fail("locked");
  const after = await parseEntryForm(formData);

  try {
    await sql`
      UPDATE finance_entries SET occurred_on = ${after.occurred_on}, amount_cents = ${after.amount_cents}, category = ${after.category},
        counterparty = ${after.counterparty}, description = ${after.description}, activity_id = ${after.activity_id}, activity_label = ${after.activity_label}
      WHERE id = ${entryId.data} AND seq IS NULL
    `;
  } catch (error) {
    if ((error as { code?: string }).code === "23000") fail("year-closed");
    throw error;
  }
  await logAudit(actor, "entry_edited", { id: entryId.data, before, after });
  revalidatePath(HOME, "layout");
  redirect(`${LEDGER}&notice=updated`);
}

/** Deletes an open entry that has no receipts. The deleted values are written to the audit log. */
export async function deleteEntry(formData: FormData) {
  const actor = await requireFinance("write");
  const entryId = id.safeParse(formData.get("id"));
  if (!entryId.success) fail("invalid");
  const before = await findOpenEntry(entryId.data);
  if (!before) fail("locked");

  try {
    await sql`DELETE FROM finance_entries WHERE id = ${entryId.data} AND seq IS NULL`;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23503") fail("has-receipts");
    if (code === "23000") fail("locked");
    throw error;
  }
  await logAudit(actor, "entry_deleted", { id: entryId.data, before });
  revalidatePath(HOME, "layout");
  redirect(`${LEDGER}&notice=deleted`);
}

/** Once a mutation is sealed (its book year is closed) a mistake is cancelled by an equal and opposite mutation dated today, with the reason. */
export async function reverseEntry(formData: FormData) {
  const actor = await requireFinance("write");
  const parsedId = id.safeParse(formData.get("id"));
  if (!parsedId.success) fail("invalid");
  const entryId = parsedId.data;
  const reason = z.string().trim().min(1).max(200).safeParse(formData.get("reason"));
  if (!reason.success) fail("reason-needed");

  const [original] = await sql<{ amount_cents: number; occurred_on: string; category: string; counterparty: string; activity_id: string | null; activity_label: string; description: string }[]>`
    SELECT amount_cents::float8, to_char(occurred_on, 'YYYY-MM-DD') AS occurred_on, category, counterparty, activity_id, activity_label, description
    FROM finance_entries WHERE id = ${entryId} AND reverses_id IS NULL AND seq IS NOT NULL
  `;
  if (!original) fail("invalid");

  try {
    await sql`
      INSERT INTO finance_entries (occurred_on, amount_cents, category, counterparty, description, activity_id, activity_label, reverses_id, created_by_id, created_by_name)
      VALUES (CURRENT_DATE, ${-original.amount_cents}, ${original.category}, ${original.counterparty},
        ${`Reversal: ${reason.data} (was: ${original.description})`.slice(0, 300)}, ${original.activity_id}, ${original.activity_label}, ${entryId}, ${actor.userId}, ${actor.name})
    `;
  } catch (error) {
    // Only the unique index on reverses_id means "already reversed"; anything else is a real failure, not a notice.
    if ((error as { code?: string }).code === "23505") fail("already-reversed");
    throw error;
  }
  revalidatePath(HOME, "layout");
  redirect(`${LEDGER}&notice=reversed`);
}

/** Closes a book year after it has ended: its open mutations are sealed into the hash chain (the database enforces every rule). */
export async function closeBookYear(formData: FormData) {
  const actor = await requireFinance("write");
  const year = z.coerce.number().int().min(2000).max(2200).safeParse(formData.get("year"));
  if (!year.success) redirect(`${YEARS}&notice=invalid`);
  if (year.data >= new Date().getFullYear()) redirect(`${YEARS}&notice=year-not-ended`);

  let sealed: number;
  try {
    const [row] = await sql<{ sealed: number }[]>`SELECT finance_close_year(${year.data}, ${actor.userId}, ${actor.name}) AS sealed`;
    sealed = row.sealed;
  } catch (error) {
    if ((error as { code?: string }).code === "23000") redirect(`${YEARS}&notice=year-close-failed`);
    throw error;
  }
  await logAudit(actor, "year_closed", { year: year.data, sealed });
  revalidatePath(HOME, "layout");
  redirect(`${YEARS}&notice=year-closed-ok`);
}

const budgetSchema = z.object({
  activity_id: z.uuid(),
  planned_expense: z.string().transform((v) => parseEuroToCents(v || "0")),
  planned_income: z.string().transform((v) => parseEuroToCents(v || "0")),
});

export async function setBudget(formData: FormData) {
  const actor = await requireFinance("write");
  const parsed = budgetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.planned_expense == null || parsed.data.planned_income == null) redirect(`${BUDGETS}&notice=invalid`);
  const { activity_id, planned_expense, planned_income } = parsed.data;
  const [exists] = await sql`SELECT 1 FROM activities WHERE id = ${activity_id}`;
  if (!exists) redirect(`${BUDGETS}&notice=invalid`);

  const [before] = await sql<{ planned_expense_cents: number; planned_income_cents: number }[]>`
    SELECT planned_expense_cents::float8, planned_income_cents::float8 FROM activity_budgets WHERE activity_id = ${activity_id}
  `;
  await sql`
    INSERT INTO activity_budgets (activity_id, planned_expense_cents, planned_income_cents, updated_by_id)
    VALUES (${activity_id}, ${planned_expense}, ${planned_income}, ${actor.userId})
    ON CONFLICT (activity_id) DO UPDATE SET planned_expense_cents = EXCLUDED.planned_expense_cents,
      planned_income_cents = EXCLUDED.planned_income_cents, updated_by_id = EXCLUDED.updated_by_id, updated_at = NOW()
  `;
  await logAudit(actor, "budget_set", {
    activity_id,
    before: before ?? null,
    after: { planned_expense_cents: planned_expense, planned_income_cents: planned_income },
  });
  revalidatePath(HOME, "layout");
  redirect(`${BUDGETS}&notice=budget-saved`);
}
