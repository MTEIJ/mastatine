"use client";

import { useId, useRef } from "react";
import { buttonClass } from "./classes";

interface ModalProps {
  /** Text of the button that opens the dialog. */
  label: string;
  title: string;
  description?: string;
  /** Accessible name of the opening button when the label alone is ambiguous (several in one table). */
  triggerLabel?: string;
  triggerClassName?: string;
  /** Extra classes on the dialog, e.g. "modal--wide" for a long form. */
  dialogClassName?: string;
  children: React.ReactNode;
}

/** A button that opens its children in a native modal dialog: focus is trapped, Esc and a click outside close it. */
export default function Modal({ label, title, description, triggerLabel, triggerClassName = buttonClass({ variant: "secondary", size: "sm" }), dialogClassName, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button type="button" className={triggerClassName} aria-label={triggerLabel} aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={ref}
        className={dialogClassName ? `modal ${dialogClassName}` : "modal"}
        aria-labelledby={titleId}
        onClick={(event) => {
          // The panel fills the dialog, so a click on the dialog element itself is a click on the backdrop.
          if (event.target === ref.current) ref.current?.close();
        }}
      >
        <div className="modal__panel">
          <header className="modal__head">
            <div>
              <h2 id={titleId}>{title}</h2>
              {description && <p>{description}</p>}
            </div>
            <button type="button" className="modal__close" aria-label="Close" onClick={() => ref.current?.close()}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>
          <div className="modal__body">{children}</div>
        </div>
      </dialog>
    </>
  );
}
