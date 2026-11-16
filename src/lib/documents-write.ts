import { z } from "zod";
import sql from "@/lib/db";
import { CATEGORY_VALUES, MAX_DOCUMENT_BYTES } from "@/lib/document-folders";
import { removeDocumentFile, storeDocument } from "@/lib/documents";

export type WriteResult = { ok: true } | { ok: false; error: string };

const fail = (error: string): WriteResult => ({ ok: false, error });

const metaSchema = z.object({
  category: z.enum(CATEGORY_VALUES),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600).default(""),
  version_label: z.string().trim().max(40).default(""),
  document_date: z.iso.date().default(() => new Date().toISOString().slice(0, 10)),
  visibility: z.enum(["members", "public"]).default("members"),
});

/** Reads the chosen PDF: null when there is none, an error message when it is too big or not a PDF. */
async function readFile(form: FormData) {
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: null, file: null, stored: null } as const;
  if (file.size > MAX_DOCUMENT_BYTES) return { error: "That file is too large (max 10 MB)." } as const;
  const stored = await storeDocument(new Uint8Array(await file.arrayBuffer()));
  if (!stored) return { error: "Only PDF files can be uploaded." } as const;
  return { error: null, file, stored } as const;
}

/** Adds a document (no `id` in the form) or changes one (with `id`; a new file replaces the old one). */
export async function saveDocument(form: FormData, userId: string): Promise<WriteResult> {
  const meta = metaSchema.safeParse(Object.fromEntries(form));
  if (!meta.success) return fail("Check that the title, folder and date are filled in.");
  const rawId = form.get("id");
  const id = rawId ? z.uuid().safeParse(rawId) : null;
  if (id && !id.success) return fail("That document does not exist.");

  const upload = await readFile(form);
  if (upload.error !== null) return fail(upload.error);
  const { file, stored } = upload;
  const m = meta.data;

  try {
    if (!id) {
      if (!file || !stored) return fail("Choose a PDF to upload.");
      await sql`
        INSERT INTO documents (category, title, description, version_label, document_date, visibility,
                               filename, original_name, size_bytes, sha256, uploaded_by_id)
        VALUES (${m.category}, ${m.title}, ${m.description}, ${m.version_label}, ${m.document_date}, ${m.visibility},
                ${stored.filename}, ${file.name.slice(0, 200)}, ${stored.sizeBytes}, ${stored.sha256}, ${userId})
      `;
      return { ok: true };
    }

    const [before] = await sql<{ filename: string }[]>`SELECT filename FROM documents WHERE id = ${id.data}`;
    if (!before) {
      if (stored) await removeDocumentFile(stored.filename);
      return fail("That document no longer exists.");
    }
    await sql`
      UPDATE documents SET category = ${m.category}, title = ${m.title}, description = ${m.description},
        version_label = ${m.version_label}, document_date = ${m.document_date}, visibility = ${m.visibility}, updated_at = NOW()
        ${file && stored ? sql`, filename = ${stored.filename}, original_name = ${file.name.slice(0, 200)}, size_bytes = ${stored.sizeBytes}, sha256 = ${stored.sha256}` : sql``}
      WHERE id = ${id.data}
    `;
    if (stored) await removeDocumentFile(before.filename);
    return { ok: true };
  } catch (error) {
    if (stored) await removeDocumentFile(stored.filename);
    throw error;
  }
}
