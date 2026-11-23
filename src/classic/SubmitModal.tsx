"use client";

import { useId, useRef, useState } from "react";
import SubmitForm from "./SubmitForm";
import { MASTS_CHANGED_EVENT } from "@/lib/events";

/**
 * The submit button and its form, in the shared dialog (a centred card on wide screens, a bottom sheet on phones; see
 * dialog.modal in globals.css). The button: "card" is the full-width one in the homepage card, "compact" the Masts page
 * toolbar button (an extended FAB in the app), "fab" the round + over the masts feed.
 */
export default function SubmitModal({ variant = "card" }: { variant?: "card" | "compact" | "fab" } = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  // A fresh form every time the dialog opens.
  const [formKey, setFormKey] = useState(0);
  const [done, setDone] = useState(false);

  function open() {
    setDone(false);
    setFormKey((k) => k + 1);
    ref.current?.showModal();
  }

  function close() {
    ref.current?.close();
  }

  function handleSuccess() {
    setDone(true);
    window.dispatchEvent(new Event(MASTS_CHANGED_EVENT));
    setTimeout(() => {
      close();
      document.getElementById("towers")?.scrollIntoView({ behavior: "smooth" });
    }, 1500);
  }

  return (
    <>
      {variant === "fab" ? (
        <button type="button" onClick={open} className="feed-fab" aria-haspopup="dialog" aria-label="Submit a mast">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      ) : variant === "compact" ? (
        <button type="button" onClick={open} className="masts-submit" aria-haspopup="dialog">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          Submit a mast
        </button>
      ) : (
        <button type="button" onClick={open} className="continue-reading-link" style={{ backgroundColor: "var(--orange)" }} aria-haspopup="dialog">
          Submit a Mast
        </button>
      )}

      <dialog
        ref={ref}
        className="modal"
        aria-labelledby={titleId}
        onClick={(event) => {
          // The panel fills the dialog, so a click on the dialog element itself is a click on the backdrop.
          if (event.target === ref.current) close();
        }}
      >
        <div className="modal__panel">
          <header className="modal__head">
            <div>
              <h2 id={titleId}>Submit a mast</h2>
              <p>A photo and a name is all it takes.</p>
            </div>
            <button type="button" className="modal__close" aria-label="Close" onClick={close}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          <div className="modal__body">
            {done ? (
              <div className="py-8 text-center" role="status">
                <p className="text-lg font-black text-ink">Mast submitted!</p>
                <p className="mt-1 text-sm text-muted">It is in the gallery now.</p>
              </div>
            ) : (
              <SubmitForm key={formKey} onSuccess={handleSuccess} />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
