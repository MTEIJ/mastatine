// Shared by server and browser code: nothing here may import node modules or the database.

/** Every category is a folder in the file manager. */
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

export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** A document as the file manager shows it. All fields are plain strings and numbers so it can cross to the browser. */
export interface DocumentRow {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string;
  version_label: string;
  document_date: string;
  visibility: DocumentVisibility;
  size_bytes: number;
  original_name: string;
  /** ISO timestamp (UTC) of the last change. */
  updated_at: string;
}

export const categoryLabel = (value: string) => DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

/** Categories that should have at least one document but have none yet. */
export function missingCategories(docs: readonly Pick<DocumentRow, "category">[]) {
  const present = new Set(docs.map((d) => d.category));
  return DOCUMENT_CATEGORIES.filter((c) => c.expected && !present.has(c.value));
}

export const formatSize = (bytes: number) => (bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
