import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sql from "@/lib/db";
import { logAudit } from "@/lib/finance";
import { getFinanceAccess } from "@/lib/finance-access";
import { MAX_RECEIPT_BYTES, removeReceiptFile, storeReceipt } from "@/lib/finance-files";
import { siteUrl } from "@/lib/env";
import { isSameOrigin } from "@/lib/request";

const back = (notice: string) => NextResponse.redirect(`${siteUrl()}/mastapps/finance?view=mutations&notice=${notice}`, 303);

/** Attach a receipt or invoice (photo or PDF) to a ledger entry. Plain form post: multipart is too big for a server action. */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  const access = await getFinanceAccess();
  if (!access?.canWrite) return new NextResponse("Not found", { status: 404 });

  const declared = Number(req.headers.get("content-length"));
  if (declared > MAX_RECEIPT_BYTES + 1024 * 1024) return back("receipt-too-big");

  const form = await req.formData().catch(() => null);
  const entryId = z.uuid().safeParse(form?.get("entry_id"));
  const file = form?.get("file");
  if (!entryId.success || !(file instanceof File)) return back("receipt-invalid");
  if (file.size === 0 || file.size > MAX_RECEIPT_BYTES) return back("receipt-too-big");

  const [entry] = await sql`SELECT 1 FROM finance_entries WHERE id = ${entryId.data}`;
  if (!entry) return back("receipt-invalid");

  const stored = await storeReceipt(new Uint8Array(await file.arrayBuffer()));
  if (!stored) return back("receipt-type");

  try {
    await sql`
    INSERT INTO finance_receipts (entry_id, filename, original_name, content_type, size_bytes, sha256, uploaded_by_id, uploaded_by_name)
    VALUES (${entryId.data}, ${stored.filename}, ${file.name.slice(0, 200)}, ${stored.contentType}, ${stored.sizeBytes}, ${stored.sha256}, ${access.userId}, ${access.name})
  `;
  } catch (error) {
    await removeReceiptFile(stored.filename);
    throw error;
  }
  await logAudit(access, "receipt_added", { entry_id: entryId.data, sha256: stored.sha256 });
  return back("receipt-added");
}
