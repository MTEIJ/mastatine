import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { saveDocument } from "@/lib/documents-write";
import { isSameOrigin } from "@/lib/request";
import { getSession } from "@/lib/session";

const json = (body: { ok: boolean; error?: string }, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

/** Add or change a document. A plain form post: PDFs are too big for a server action (1 MB default, and no progress). */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) return new NextResponse("Forbidden", { status: 403 });
  const session = await getSession();
  if (session?.user.role !== "admin") return new NextResponse("Not found", { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return json({ ok: false, error: "The upload could not be read." }, 400);

  const result = await saveDocument(form, session.user.id);
  if (!result.ok) return json(result, 422);
  revalidatePath("/documents");
  return json({ ok: true });
}
