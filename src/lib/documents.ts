import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sql from "@/lib/db";
import type { DocumentRow } from "@/lib/document-folders";

export * from "@/lib/document-folders";

/** Private: this folder is never served directly, only through the checked /documents/[id] route. */
export const DOCUMENTS_DIR = path.resolve(/* turbopackIgnore: true */ process.env.DOCUMENTS_DIR ?? "./documents-data");
export const DOCUMENT_FILENAME_RE = /^[a-z0-9-]+\.pdf$/;

const columns = () => sql`
  id, category, title, description, version_label, to_char(document_date, 'YYYY-MM-DD') AS document_date, visibility,
  size_bytes, original_name, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
`;

/** Documents the viewer may see: everything for a signed-in member, only the public ones otherwise. */
export function getDocuments(signedIn: boolean): Promise<DocumentRow[]> {
  return sql<DocumentRow[]>`
    SELECT ${columns()} FROM documents
    WHERE ${signedIn ? sql`TRUE` : sql`visibility = 'public'`}
    ORDER BY document_date DESC, title
  `;
}

export function getAllDocuments(): Promise<DocumentRow[]> {
  return sql<DocumentRow[]>`SELECT ${columns()} FROM documents ORDER BY document_date DESC, title`;
}

export interface StoredDocument {
  filename: string;
  sizeBytes: number;
  sha256: string;
}

/** Only real PDFs (checked by their bytes, not the client's claim) are stored, under a random server-made name. */
export async function storeDocument(bytes: Uint8Array): Promise<StoredDocument | null> {
  if (String.fromCharCode(...bytes.slice(0, 5)) !== "%PDF-") return null;
  const filename = `${randomUUID()}.pdf`;
  await mkdir(DOCUMENTS_DIR, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ DOCUMENTS_DIR, filename), bytes, { flag: "wx" });
  return { filename, sizeBytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };
}

export async function removeDocumentFile(filename: string): Promise<void> {
  if (!DOCUMENT_FILENAME_RE.test(filename)) return;
  await unlink(path.join(/* turbopackIgnore: true */ DOCUMENTS_DIR, filename)).catch(() => {});
}

/** Reads a stored document and confirms it still matches the hash recorded at upload. */
export async function readDocument(filename: string, expectedSha256: string): Promise<Buffer | null> {
  if (!DOCUMENT_FILENAME_RE.test(filename)) return null;
  const data = await readFile(path.join(/* turbopackIgnore: true */ DOCUMENTS_DIR, filename)).catch(() => null);
  if (!data) return null;
  return createHash("sha256").update(data).digest("hex") === expectedSha256 ? data : null;
}
