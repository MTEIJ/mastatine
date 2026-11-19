"use client";

import { useState } from "react";

interface CopyFieldProps {
  value: string;
  /** Accessible name of the field (and of the button in compact mode). */
  label: string;
  /**
   * Only a copy button, for long lists (personal links). The address appears as a selectable field when the clipboard
   * is unavailable, so it can still be copied by hand.
   */
  compact?: boolean;
}

/** A read-only address with a copy button. The text stays selectable when the clipboard is unavailable. */
export default function CopyField({ value, label, compact = false }: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [showField, setShowField] = useState(!compact);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context or denied): show the field so it can be selected by hand.
      setShowField(true);
    }
  }

  return (
    <div className={`flex items-center gap-2 ${showField ? "min-w-0 flex-1" : ""}`}>
      {showField && (
        <input className="input min-w-0 flex-1 text-sm" readOnly value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
      )}
      <button
        type="button"
        className="btn btn-secondary btn-sm shrink-0"
        onClick={copy}
        aria-live="polite"
        aria-label={compact && !showField ? `Copy ${label.toLowerCase()}` : undefined}
      >
        {copied ? "Copied!" : compact ? "Copy link" : "Copy"}
      </button>
    </div>
  );
}
