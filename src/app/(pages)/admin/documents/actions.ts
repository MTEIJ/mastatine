"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import sql from "@/lib/db";
import { CATEGORY_VALUES, MAX_DOCUMENT_BYTES, removeDocumentFile, storeDocument } from "@/lib/documents";
import { requireAdmin } from "@/lib/session";

// Server actions are public HTTP endpoints: every one re-checks the admin role itself.

const PAGE = "/admin/documents";
const done = (notice: string): never => {
  revalidatePath(PAGE);
  revalidatePath("/documents");
  redirect(`${PAGE}?notice=${notice}`);
};

const metaSchema = z.object({
  category: z.enum(CATEGORY_VALUES),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600),
  version_label: z.string().trim().max(40),
  document_date: z.iso.date(),
  visibility: z.enum(["members", "public"]),
});

/** Returns the stored PDF, null when no file was chosen, or throws a notice code for a bad file. */
async function readUpload(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > MAX_DOCUMENT_BYTES) return done("too-big");
  const stored = await storeDocument(new Uint8Array(await file.arrayBuffer()));
  return stored ?? done("not-pdf");
}

export async function uploadDocument(formData: FormData) {
  const session = await requireAdmin();
  const meta = metaSchema.safeParse(Object.fromEntries(formData));
  if (!meta.success) return done("invalid");
  const stored = await readUpload(formData);
  if (!stored) return done("no-file");
  const file = formData.get("file") as File;

  try {
    await sql`
      INSERT INTO documents (category, title, description, version_label, document_date, visibility,
                             filename, original_name, size_bytes, sha256, uploaded_by_id)
      VALUES (${meta.data.category}, ${meta.data.title}, ${meta.data.description}, ${meta.data.version_label},
              ${meta.data.document_date}, ${meta.data.visibility}, ${stored.filename}, ${file.name.slice(0, 200)},
              ${stored.sizeBytes}, ${stored.sha256}, ${session.user.id})
    `;
  } catch (error) {
    await removeDocumentFile(stored.filename);
    throw error;
  }
  return done("added");
}

export async function updateDocument(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  const meta = metaSchema.safeParse(Object.fromEntries(formData));
  if (!id.success || !meta.success) return done("invalid");

  const [before] = await sql<{ filename: string }[]>`SELECT filename FROM documents WHERE id = ${id.data}`;
  if (!before) return done("invalid");

  // A new file replaces the old one; without a file only the details change.
  const stored = await readUpload(formData);
  const file = formData.get("file");
  try {
    await sql`
      UPDATE documents SET category = ${meta.data.category}, title = ${meta.data.title}, description = ${meta.data.description},
        version_label = ${meta.data.version_label}, document_date = ${meta.data.document_date},
        visibility = ${meta.data.visibility}, updated_at = NOW()
        ${stored && file instanceof File ? sql`, filename = ${stored.filename}, original_name = ${file.name.slice(0, 200)}, size_bytes = ${stored.sizeBytes}, sha256 = ${stored.sha256}` : sql``}
      WHERE id = ${id.data}
    `;
  } catch (error) {
    if (stored) await removeDocumentFile(stored.filename);
    throw error;
  }
  if (stored) await removeDocumentFile(before.filename);
  return done("saved");
}

export async function deleteDocument(formData: FormData) {
  await requireAdmin();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!id.success) return done("invalid");
  const [row] = await sql<{ filename: string }[]>`DELETE FROM documents WHERE id = ${id.data} RETURNING filename`;
  if (row) await removeDocumentFile(row.filename);
  return done("deleted");
}
