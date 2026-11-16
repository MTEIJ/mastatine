"use client";

import { useEffect, useRef, useState } from "react";
import { DOCUMENT_CATEGORIES, formatSize, type DocumentRow } from "@/lib/document-folders";

interface DetailsDialogProps {
  doc: DocumentRow | null;
  onClose: () => void;
  /** Called after the details were saved. */
  onSaved: () => void;
  onDelete: (doc: DocumentRow) => void;
}

/** Rename, move, change who can read a document, or replace its PDF. */
export default function DetailsDialog({ doc, onClose, onSaved, onDelete }: DetailsDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (doc && !dialog.open) dialog.showModal();
    if (!doc && dialog.open) dialog.close();
  }, [doc]);

  async function save(form: HTMLFormElement) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/admin/documents/upload", { method: "POST", body: new FormData(form) });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "That was not saved.");
        return;
      }
      onSaved();
    } catch {
      setError("The connection was lost.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-label={doc ? `Details of ${doc.title}` : "Details"}
      onClose={() => {
        setError(null);
        onClose();
      }}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      {doc && (
        <div className="modal__panel">
          <header className="modal__head">
            <div className="min-w-0">
              <h2 className="truncate">Details</h2>
              <p className="truncate">{doc.original_name} · {formatSize(doc.size_bytes)}</p>
            </div>
            <button type="button" className="modal__close" aria-label="Close" onClick={() => ref.current?.close()}>×</button>
          </header>
          <form
            key={doc.id}
            className="modal__body space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void save(event.currentTarget);
            }}
          >
            <input type="hidden" name="id" value={doc.id} />
            <div>
              <label className="label" htmlFor="d-title">Name</label>
              <input id="d-title" name="title" className="input" required maxLength={160} defaultValue={doc.title} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="d-category">Folder</label>
                <select id="d-category" name="category" className="input" defaultValue={doc.category}>
                  {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="d-visibility">Who can read it</label>
                <select id="d-visibility" name="visibility" className="input" defaultValue={doc.visibility}>
                  <option value="members">Signed-in members</option>
                  <option value="public">Anyone</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="d-date">Date</label>
                <input id="d-date" name="document_date" type="date" className="input" required defaultValue={doc.document_date} />
              </div>
              <div>
                <label className="label" htmlFor="d-version">Version</label>
                <input id="d-version" name="version_label" className="input" maxLength={40} placeholder="v1.0" defaultValue={doc.version_label} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="d-description">Description (optional)</label>
              <input id="d-description" name="description" className="input" maxLength={600} defaultValue={doc.description} />
            </div>
            <div>
              <label className="label" htmlFor="d-file">Replace the PDF (optional)</label>
              <input id="d-file" name="file" type="file" accept="application/pdf,.pdf" className="input" />
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => onDelete(doc)}>Delete</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            </div>
          </form>
        </div>
      )}
    </dialog>
  );
}
