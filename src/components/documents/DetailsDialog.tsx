"use client";

import { useEffect, useRef, useState } from "react";
import { DOCUMENT_CATEGORIES, formatSize, type DocumentRow } from "@/lib/document-folders";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Field";

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
              <Label htmlFor="d-title">Name</Label>
              <Input id="d-title" name="title" required maxLength={160} defaultValue={doc.title} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="d-category">Folder</Label>
                <Select id="d-category" name="category" defaultValue={doc.category}>
                  {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="d-visibility">Who can read it</Label>
                <Select id="d-visibility" name="visibility" defaultValue={doc.visibility}>
                  <option value="members">Signed-in members</option>
                  <option value="public">Anyone</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="d-date">Date</Label>
                <Input id="d-date" name="document_date" type="date" required defaultValue={doc.document_date} />
              </div>
              <div>
                <Label htmlFor="d-version">Version</Label>
                <Input id="d-version" name="version_label" maxLength={40} placeholder="v1.0" defaultValue={doc.version_label} />
              </div>
            </div>
            <div>
              <Label htmlFor="d-description">Description (optional)</Label>
              <Input id="d-description" name="description" maxLength={600} defaultValue={doc.description} />
            </div>
            <div>
              <Label htmlFor="d-file">Replace the PDF (optional)</Label>
              <Input id="d-file" name="file" type="file" accept="application/pdf,.pdf" />
            </div>
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <Button type="button" variant="secondary" size="sm" onClick={() => onDelete(doc)}>Delete</Button>
              <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </form>
        </div>
      )}
    </dialog>
  );
}
