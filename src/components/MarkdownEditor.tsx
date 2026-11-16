"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Markdown from "@/components/Markdown";
import { link, prefixLines, wrap, type Edit } from "@/lib/markdown-edit";

interface MarkdownEditorProps {
  id: string;
  name: string;
  defaultValue?: string;
  maxLength: number;
  required?: boolean;
  /** Minimum height of the text area, as a Tailwind class. */
  heightClass?: string;
}

const toolClass = "grid h-8 min-w-8 place-items-center rounded px-2 text-sm font-bold text-muted hover:bg-soft hover:text-ink";

function ToolButton({ label, title, onClick, className = "" }: { label: string; title: string; onClick: () => void; className?: string }) {
  return (
    <button type="button" title={title} aria-label={title} className={`${toolClass} ${className}`} onMouseDown={(e) => e.preventDefault()} onClick={onClick}>
      {label}
    </button>
  );
}

/** A text area that stores Markdown, with a small toolbar (bold, italic, sizes, lists, link) and a preview. Submits as a normal form field. */
export default function MarkdownEditor({ id, name, defaultValue = "", maxLength, required, heightClass = "min-h-32" }: MarkdownEditorProps) {
  const area = useRef<HTMLTextAreaElement>(null);
  const pending = useRef<{ start: number; end: number } | null>(null);
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  useLayoutEffect(() => {
    if (pending.current && area.current) {
      area.current.setSelectionRange(pending.current.start, pending.current.end);
      pending.current = null;
    }
  });

  function apply(make: (text: string, start: number, end: number) => Edit) {
    const el = area.current;
    if (!el) return;
    const edit = make(el.value, el.selectionStart, el.selectionEnd);
    pending.current = { start: edit.start, end: edit.end };
    setValue(edit.text);
    el.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (e.key === "b") {
      e.preventDefault();
      apply((t, s, en) => wrap(t, s, en, "**", "bold text"));
    } else if (e.key === "i") {
      e.preventDefault();
      apply((t, s, en) => wrap(t, s, en, "*", "italic text"));
    }
  }

  return (
    <div>
      <div role="toolbar" aria-label="Formatting" className="mb-1 flex flex-wrap items-center gap-0.5">
        <ToolButton label="B" title="Bold (Ctrl+B)" onClick={() => apply((t, s, e) => wrap(t, s, e, "**", "bold text"))} />
        <ToolButton label="I" title="Italic (Ctrl+I)" className="italic" onClick={() => apply((t, s, e) => wrap(t, s, e, "*", "italic text"))} />
        <ToolButton label="Large" title="Large heading" onClick={() => apply((t, s, e) => prefixLines(t, s, e, () => "# ", /^# /))} />
        <ToolButton label="Medium" title="Medium heading" onClick={() => apply((t, s, e) => prefixLines(t, s, e, () => "## ", /^## /))} />
        <ToolButton label="Small" title="Small heading" onClick={() => apply((t, s, e) => prefixLines(t, s, e, () => "### ", /^### /))} />
        <ToolButton label="•" title="Bulleted list" onClick={() => apply((t, s, e) => prefixLines(t, s, e, () => "- ", /^- /))} />
        <ToolButton label="1." title="Numbered list" onClick={() => apply((t, s, e) => prefixLines(t, s, e, (i) => `${i + 1}. `, /^\d+\. /))} />
        <ToolButton label="Link" title="Link" onClick={() => apply(link)} />
        <button
          type="button"
          aria-pressed={preview}
          className="ml-auto rounded px-2 py-1 text-xs font-bold text-muted hover:bg-soft hover:text-ink aria-pressed:bg-soft aria-pressed:text-ink"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setPreview((p) => !p)}
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview && (
        <div className="min-h-32 rounded-lg border border-line bg-surface px-3 py-2">
          {value.trim() ? <Markdown large>{value}</Markdown> : <p className="text-muted">Nothing to preview yet.</p>}
        </div>
      )}
      <textarea
        ref={area}
        id={id}
        name={name}
        className={`input ${heightClass}`}
        required={required}
        maxLength={maxLength}
        hidden={preview}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {!preview && <p className="mt-1 text-xs text-muted">Select text, then use the buttons. Links open in a new tab.</p>}
    </div>
  );
}
