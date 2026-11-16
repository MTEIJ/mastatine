import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sql from "@/lib/db";
import { readDocument } from "@/lib/documents";
import { getSession } from "@/lib/session";

const notFound = () => new NextResponse("Not found", { status: 404 });

/**
 * Members-only documents need a signed-in user; the file must still match the hash recorded at upload.
 * Shown inline (the file manager previews it in an overlay) unless `?download=1` asks for a download.
 * Framing is allowed for this site only; see the /documents/:id rule in next.config.ts.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) return notFound();

  const [doc] = await sql<{ filename: string; sha256: string; title: string; visibility: string }[]>`
    SELECT filename, sha256, title, visibility FROM documents WHERE id = ${id.data}
  `;
  if (!doc) return notFound();
  if (doc.visibility !== "public" && !(await getSession())) return notFound();

  const data = await readDocument(doc.filename, doc.sha256);
  if (!data) return new NextResponse("This file is missing or no longer matches its recorded hash.", { status: 409 });

  const safeName = doc.title.replace(/[^A-Za-z0-9 ._-]+/g, "").trim().slice(0, 80) || "document";
  const disposition = req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeName}.pdf"`,
      "Cache-Control": doc.visibility === "public" ? "public, max-age=300" : "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
