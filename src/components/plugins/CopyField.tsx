"use client";

import { useState } from "react";

/** A read-only address with a copy button. The text stays selectable when the clipboard is unavailable. */
export default function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (insecure context or denied): the field can still be selected by hand.
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input className="input min-w-0 flex-1" readOnly value={value} aria-label={label} onFocus={(e) => e.currentTarget.select()} />
      <button type="button" className="btn btn-secondary btn-sm" onClick={copy} aria-live="polite">
        {copied ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
