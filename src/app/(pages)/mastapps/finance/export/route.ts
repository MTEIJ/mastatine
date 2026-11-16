import { NextResponse } from "next/server";
import sql from "@/lib/db";
import { logAudit } from "@/lib/finance";
import { getFinanceAccess } from "@/lib/finance-access";
import { centsToDecimal } from "@/lib/finance-money";

/** Text that a spreadsheet would run as a formula (=, +, -, @) gets a leading quote, then standard CSV quoting. */
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

/** The sealed mutations as CSV (those in a book year that is not closed yet are not included) for the annual accounts or the kascommissie, including each row's hash. */
export async function GET() {
  const access = await getFinanceAccess();
  if (!access) return new NextResponse("Not found", { status: 404 });

  const rows = await sql<
    { seq: number; occurred_on: string; amount_cents: number; category: string; counterparty: string; description: string; activity_label: string; reverses_seq: number | null; created_by_name: string; created_at: Date; entry_hash: string }[]
  >`
    SELECT e.seq::int, to_char(e.occurred_on, 'YYYY-MM-DD') AS occurred_on, e.amount_cents::float8, e.category, e.counterparty,
      e.description, e.activity_label, o.seq::int AS reverses_seq, e.created_by_name, e.created_at, e.entry_hash
    FROM finance_entries e LEFT JOIN finance_entries o ON o.id = e.reverses_id WHERE e.seq IS NOT NULL ORDER BY e.seq
  `;
  await logAudit(access, "export_csv", { rows: rows.length });

  const header = ["seq", "date", "amount_eur", "category", "counterparty", "description", "activity", "reverses_seq", "entered_by", "entered_at", "hash"];
  const lines = rows.map((r) =>
    [
      String(r.seq),
      r.occurred_on,
      centsToDecimal(r.amount_cents),
      r.category,
      cell(r.counterparty),
      cell(r.description),
      cell(r.activity_label),
      r.reverses_seq == null ? "" : String(r.reverses_seq),
      cell(r.created_by_name),
      r.created_at.toISOString(),
      r.entry_hash,
    ].join(","),
  );
  return new NextResponse(`﻿${[header.join(","), ...lines].join("\r\n")}\r\n`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mastatine-ledger-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
