import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sql from "@/lib/db";

/** Private: this folder is never served directly, only through the checked /documents/[id] route. */
export const DOCUMENTS_DIR = path.resolve(/* turbopackIgnore: true */ process.env.DOCUMENTS_DIR ?? "./documents-data");
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_FILENAME_RE = /^[a-z0-9-]+\.pdf$/;

export const DOCUMENT_CATEGORIES = [
  { value: "statutes", label: "Statutes", hint: "Statuten: the rules the association is founded on.", expected: true },
  { value: "house_rules", label: "House rules", hint: "Huishoudelijk reglement: how things work day to day.", expected: true },
  { value: "privacy", label: "Privacy statement", hint: "What personal data is kept and why (AVG/GDPR).", expected: true },
  { value: "code_of_conduct", label: "Code of conduct", hint: "Expected behaviour at activities and online.", expected: true },
  { value: "complaints", label: "Complaints procedure", hint: "How to complain, and who the confidential contact person is.", expected: true },
  { value: "policy_plan", label: "Policy plan", hint: "Beleidsplan: what the board plans to do this year.", expected: true },
  { value: "annual_report", label: "Annual report", hint: "Jaarverslag: what happened last year.", expected: true },
  { value: "financial", label: "Budget and financial statements", hint: "Begroting and jaarrekening.", expected: true },
  { value: "gmm", label: "General meeting papers", hint: "ALV: agendas and approved minutes.", expected: false },
  { value: "other", label: "Other", hint: "Anything else members should be able to read.", expected: false },
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["value"];
export type DocumentVisibility = "members" | "public";

export const CATEGORY_VALUES = DOCUMENT_CATEGORIES.map((c) => c.value) as [DocumentCategory, ...DocumentCategory[]];

export interface DocumentRow {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string;
  version_label: string;
  document_date: string;
  visibility: DocumentVisibility;
  size_bytes: number;
  updated_at: Date;
}

const COLUMNS = sql`id, category, title, description, version_label, to_char(document_date, 'YYYY-MM-DD') AS document_date, visibility, size_bytes, updated_at`;

/** Documents the viewer may see: everything for a signed-in member, only the public ones otherwise. */
export function getDocuments(signedIn: boolean): Promise<DocumentRow[]> {
  return sql<DocumentRow[]>`
    SELECT ${COLUMNS} FROM documents
    WHERE ${signedIn ? sql`TRUE` : sql`visibility = 'public'`}
    ORDER BY document_date DESC, title
  `;
}

export function getAllDocuments(): Promise<DocumentRow[]> {
  return sql<DocumentRow[]>`SELECT ${COLUMNS} FROM documents ORDER BY document_date DESC, title`;
}

export const categoryLabel = (value: string) => DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

/** Categories that should have at least one document but have none yet. */
export function missingCategories(docs: readonly DocumentRow[]) {
  const present = new Set(docs.map((d) => d.category));
  return DOCUMENT_CATEGORIES.filter((c) => c.expected && !present.has(c.value));
}

export const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);

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
