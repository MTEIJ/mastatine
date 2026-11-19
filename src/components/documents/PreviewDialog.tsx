"use client";

import { useEffect, useRef } from "react";
import { buttonClass } from "@/components/ui/classes";
import { categoryLabel, formatSize, type DocumentRow } from "@/lib/document-folders";
import { ChevronIcon, CloseIcon, DownloadIcon, EditIcon, ExternalIcon } from "./FileIcons";

interface PreviewDialogProps {
  doc: DocumentRow | null;
  /** Position in the list being browsed, for the previous/next buttons. */
  index: number;
  count: number;
  onStep: (delta: -1 | 1) => void;
  onClose: () => void;
  /** Admins get a shortcut to the details of the file they are looking at. */
  onEdit?: (doc: DocumentRow) => void;
}

/** A PDF in a large overlay. Left and right arrows step through the files in the current folder. */
export default function PreviewDialog({ doc, index, count, onStep, onClose, onEdit }: PreviewDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (doc && !dialog.open) dialog.showModal();
    if (!doc && dialog.open) dialog.close();
  }, [doc]);

  useEffect(() => {
    if (!doc) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") onStep(-1);
      if (event.key === "ArrowRight") onStep(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doc, onStep]);

  const base = doc ? `/documents/${doc.id}` : "";
  const button = buttonClass({ variant: "secondary", size: "sm" }, "gap-1.5");

  return (
    <dialog
      ref={ref}
      className="modal modal--viewer"
      aria-label={doc ? `Preview of ${doc.title}` : "Preview"}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      {doc && (
        <div className="modal__panel">
          <header className="modal__head">
            <div className="min-w-0">
              <h2 className="truncate">{doc.title}</h2>
              <p>
                {categoryLabel(doc.category)} · {doc.document_date}
                {doc.version_label && ` · ${doc.version_label}`} · {formatSize(doc.size_bytes)}
                {count > 1 && ` · ${index + 1} of ${count}`}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
              {count > 1 && (
                <>
                  <button type="button" className={button} onClick={() => onStep(-1)} aria-label="Previous file"><ChevronIcon direction="left" size={16} /></button>
                  <button type="button" className={button} onClick={() => onStep(1)} aria-label="Next file"><ChevronIcon direction="right" size={16} /></button>
                </>
              )}
              {onEdit && <button type="button" className={button} onClick={() => onEdit(doc)}><EditIcon size={16} />Details</button>}
              <a className={button} href={`${base}?download=1`}><DownloadIcon size={16} />Download</a>
              <a className={button} href={base} target="_blank" rel="noopener noreferrer"><ExternalIcon size={16} />New tab</a>
              <button type="button" className="modal__close !m-0" aria-label="Close" onClick={() => ref.current?.close()}><CloseIcon size={18} /></button>
            </div>
          </header>
          {/* Phones often show only the first page of an embedded PDF, hence the download and new-tab buttons above. */}
          <iframe key={doc.id} title={doc.title} src={`${base}#view=FitH`} className="min-h-0 w-full flex-1 border-0 bg-soft" />
        </div>
      )}
    </dialog>
  );
}
