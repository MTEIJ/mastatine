import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import {
  DOCUMENT_CATEGORIES,
  categoryLabel,
  formatSize,
  getAllDocuments,
  missingCategories,
  type DocumentRow,
} from "@/lib/documents";
import { requireAdmin } from "@/lib/session";
import { deleteDocument, updateDocument, uploadDocument } from "./actions";

const NOTICES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  added: { text: "Document added.", tone: "ok" },
  saved: { text: "Document saved.", tone: "ok" },
  deleted: { text: "Document deleted.", tone: "ok" },
  invalid: { text: "That was not saved. Check that the title, category and date are filled in.", tone: "bad" },
  "no-file": { text: "Choose a PDF to upload.", tone: "bad" },
  "not-pdf": { text: "Only PDF files can be uploaded.", tone: "bad" },
  "too-big": { text: "That file is too large (max 10 MB).", tone: "bad" },
};

export const instant = false;

function Fields({ doc }: { doc?: DocumentRow }) {
  const key = doc?.id ?? "new";
  return (
    <>
      <div className="min-w-0 flex-[2] basis-56">
        <label className="label" htmlFor={`title-${key}`}>Title</label>
        <input id={`title-${key}`} name="title" className="input" required maxLength={160} defaultValue={doc?.title} />
      </div>
      <div className="min-w-0 flex-1 basis-44">
        <label className="label" htmlFor={`category-${key}`}>Category</label>
        <select id={`category-${key}`} name="category" className="input" defaultValue={doc?.category ?? "statutes"}>
          {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>
      <div className="min-w-0 flex-1 basis-32">
        <label className="label" htmlFor={`date-${key}`}>Date</label>
        <input id={`date-${key}`} name="document_date" type="date" className="input" required defaultValue={doc?.document_date ?? new Date().toISOString().slice(0, 10)} />
      </div>
      <div className="min-w-0 flex-1 basis-28">
        <label className="label" htmlFor={`version-${key}`}>Version</label>
        <input id={`version-${key}`} name="version_label" className="input" maxLength={40} placeholder="v1.0" defaultValue={doc?.version_label} />
      </div>
      <div className="min-w-0 flex-1 basis-40">
        <label className="label" htmlFor={`visibility-${key}`}>Who can read it</label>
        <select id={`visibility-${key}`} name="visibility" className="input" defaultValue={doc?.visibility ?? "members"}>
          <option value="members">Signed-in members</option>
          <option value="public">Anyone</option>
        </select>
      </div>
      <div className="min-w-0 basis-full">
        <label className="label" htmlFor={`description-${key}`}>Description (optional)</label>
        <input id={`description-${key}`} name="description" className="input" maxLength={600} defaultValue={doc?.description} />
      </div>
      <div className="min-w-0 basis-full">
        <label className="label" htmlFor={`file-${key}`}>{doc ? "Replace the PDF (optional)" : "PDF file (max 10 MB)"}</label>
        <input id={`file-${key}`} name="file" type="file" accept="application/pdf,.pdf" className="input" required={!doc} />
      </div>
    </>
  );
}

export default async function AdminDocuments(props: { searchParams: Promise<{ notice?: string }> }) {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const { notice } = await props.searchParams;
  const docs = await getAllDocuments();
  const missing = missingCategories(docs);
  const message = notice ? NOTICES[notice] : undefined;

  return (
    <div className="space-y-5">
      {message && (
        <p role="status" className={`rounded-xl px-4 py-3 text-sm ${message.tone === "ok" ? "bg-accent-soft text-accent-text" : "bg-danger/10 text-danger"}`}>
          {message.text}
        </p>
      )}

      <section aria-labelledby="checklist-title" className="card space-y-2 p-4">
        <h2 id="checklist-title" className="text-base font-extrabold">Checklist</h2>
        {missing.length === 0 ? (
          <p className="text-sm text-muted">Every standard document is in place.</p>
        ) : (
          <>
            <p className="text-sm text-muted">Still missing ({missing.length}):</p>
            <ul className="list-disc space-y-0.5 pl-5 text-sm">
              {missing.map((c) => <li key={c.value}><span className="font-bold">{c.label}</span> <span className="text-muted">· {c.hint}</span></li>)}
            </ul>
          </>
        )}
        <p className="text-xs text-muted">
          Documents are shown to signed-in members at <Link href="/documents" className="underline">/documents</Link>. Mark one “Anyone” to make it public
          (the privacy statement is a good candidate).
        </p>
      </section>

      <section aria-labelledby="upload-title">
        <h2 id="upload-title" className="text-base font-extrabold">Add a document</h2>
        <form action={uploadDocument} className="card mt-2 flex flex-wrap items-end gap-3 p-4">
          <Fields />
          <button className="btn btn-primary btn-sm" type="submit">Upload</button>
        </form>
      </section>

      <section aria-labelledby="list-title">
        <h2 id="list-title" className="mb-2 text-base font-extrabold">Documents ({docs.length})</h2>
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li key={doc.id} className="card p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <a href={`/documents/${doc.id}`} className="font-bold hover:text-accent-text" target="_blank" rel="noopener noreferrer">{doc.title}</a>
                  <p className="text-xs text-muted">
                    {categoryLabel(doc.category)} · {doc.document_date}{doc.version_label && ` · ${doc.version_label}`} · {formatSize(doc.size_bytes)} ·{" "}
                    {doc.visibility === "public" ? "public" : "members only"}
                  </p>
                </div>
                <form action={deleteDocument}>
                  <input type="hidden" name="id" value={doc.id} />
                  <ConfirmButton message={`Delete “${doc.title}”? The file is removed for good.`} className="btn btn-secondary btn-sm">Delete</ConfirmButton>
                </form>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-semibold text-accent-text">Edit</summary>
                <form action={updateDocument} className="mt-2 flex flex-wrap items-end gap-3">
                  <input type="hidden" name="id" value={doc.id} />
                  <Fields doc={doc} />
                  <button className="btn btn-primary btn-sm" type="submit">Save</button>
                </form>
              </details>
            </li>
          ))}
          {docs.length === 0 && <li className="py-6 text-center text-muted">No documents yet.</li>}
        </ul>
      </section>
    </div>
  );
}
