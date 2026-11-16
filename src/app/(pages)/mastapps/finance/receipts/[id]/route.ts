import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sql from "@/lib/db";
import { getFinanceAccess } from "@/lib/finance-access";
import { readReceipt } from "@/lib/finance-files";

const notFound = () => new NextResponse("Not found", { status: 404 });

/** Receipts are only served to treasurers and auditors, and only if the file still matches the hash recorded at upload. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getFinanceAccess())) return notFound();
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return notFound();

  const [receipt] = await sql<{ filename: string; content_type: string; sha256: string; original_name: string }[]>`
    SELECT filename, content_type, sha256, original_name FROM finance_receipts WHERE id = ${id.data}
  `;
  if (!receipt) return notFound();

  const data = await readReceipt(receipt.filename, receipt.sha256);
  if (!data) return new NextResponse("This file is missing or no longer matches its recorded hash.", { status: 409 });

  const ext = receipt.content_type === "application/pdf" ? "pdf" : "webp";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": receipt.content_type,
      "Content-Disposition": `${ext === "pdf" ? "attachment" : "inline"}; filename="receipt-${id.data.slice(0, 8)}.${ext}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
    },
  });
}
