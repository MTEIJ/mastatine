"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import sql from "@/lib/db";
import { CATEGORY_VALUES } from "@/lib/document-folders";
import { removeDocumentFile } from "@/lib/documents";
import { requireAdmin } from "@/lib/session";

// Server actions are public HTTP endpoints: every one re-checks the admin role itself.

const ids = z.array(z.uuid()).min(1).max(200);

function refresh() {
  revalidatePath("/admin/documents");
  revalidatePath("/documents");
}

/** Moves documents to another folder (category). */
export async function moveDocuments(documentIds: string[], category: string): Promise<void> {
  await requireAdmin();
  const target = z.enum(CATEGORY_VALUES).parse(category);
  await sql`UPDATE documents SET category = ${target}, updated_at = NOW() WHERE id IN ${sql(ids.parse(documentIds))}`;
  refresh();
}

/** Deletes documents and their files for good. */
export async function deleteDocuments(documentIds: string[]): Promise<void> {
  await requireAdmin();
  const rows = await sql<{ filename: string }[]>`DELETE FROM documents WHERE id IN ${sql(ids.parse(documentIds))} RETURNING filename`;
  await Promise.all(rows.map((row) => removeDocumentFile(row.filename)));
  refresh();
}
