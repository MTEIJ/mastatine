"use client";

import { useRef, useState } from "react";
import { MAX_DOCUMENT_BYTES, categoryLabel, type DocumentCategory } from "@/lib/document-folders";
import { UploadIcon } from "./FileIcons";
import { Button } from "@/components/ui/Button";

interface UploadItem {
  key: number;
  name: string;
  progress: number;
  state: "uploading" | "done" | "error";
  error?: string;
}

interface UploadZoneProps {
  /** The folder new files land in. */
  folder: DocumentCategory;
  /** Called once every file of a batch has finished. */
  onFinished: () => void;
}

const titleFromFile = (name: string) => name.replace(/\.pdf$/i, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 160) || "Untitled";

/** Sends one file with a progress bar. fetch cannot report upload progress, so this uses XMLHttpRequest. */
function sendFile(file: File, folder: DocumentCategory, onProgress: (fraction: number) => void): Promise<string | null> {
  return new Promise((resolve) => {
    const form = new FormData();
    form.set("file", file);
    form.set("title", titleFromFile(file.name));
    form.set("category", folder);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/admin/documents/upload");
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(event.loaded / event.total);
    xhr.onerror = () => resolve("The connection was lost.");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve(null);
      try {
        resolve((JSON.parse(xhr.responseText) as { error?: string }).error ?? "The upload failed.");
      } catch {
        resolve("The upload failed.");
      }
    };
    xhr.send(form);
  });
}

/** Drop PDFs here (or browse) to add them to the current folder, one after the other. */
export default function UploadZone({ folder, onFinished }: UploadZoneProps) {
  const input = useRef<HTMLInputElement>(null);
  const nextKey = useRef(0);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragging, setDragging] = useState(false);

  const patch = (key: number, change: Partial<UploadItem>) => setItems((list) => list.map((item) => (item.key === key ? { ...item, ...change } : item)));

  async function upload(files: File[]) {
    const queued = files.map((file) => ({ file, key: nextKey.current++ }));
    setItems((list) => [...queued.map(({ file, key }): UploadItem => ({ key, name: file.name, progress: 0, state: "uploading" })), ...list].slice(0, 8));
    for (const { file, key } of queued) {
      if (file.size > MAX_DOCUMENT_BYTES) {
        patch(key, { state: "error", error: "Too large (max 10 MB)." });
        continue;
      }
      const error = await sendFile(file, folder, (fraction) => patch(key, { progress: fraction }));
      patch(key, error ? { state: "error", error } : { state: "done", progress: 1 });
    }
    onFinished();
  }

  const label = `Add to ${categoryLabel(folder)}`;
  return (
    <div className="space-y-2">
      <div
        onDragOver={(event) => {
          // Only real files from the desktop: a file row dragged between folders must not light this up.
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          if (!event.dataTransfer.types.includes("Files")) return;
          event.preventDefault();
          setDragging(false);
          void upload([...event.dataTransfer.files]);
        }}
        className={`flex flex-wrap items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 py-4 text-sm transition-colors ${dragging ? "border-accent bg-accent-soft" : "border-line"}`}
      >
        <UploadIcon className="text-accent-text" />
        <span>
          <span className="font-bold">{label}:</span> drop PDF files here or
        </span>
        <Button type="button" variant="secondary" size="sm" onClick={() => input.current?.click()}>Browse…</Button>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          aria-label={label}
          tabIndex={-1}
          onChange={(event) => {
            void upload([...(event.target.files ?? [])]);
            event.target.value = "";
          }}
        />
      </div>
      {items.length > 0 && (
        <ul className="space-y-1 text-sm" aria-live="polite">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate">{item.name}</span>
              {item.state === "error" ? (
                <span className="text-danger">{item.error}</span>
              ) : item.state === "done" ? (
                <span className="text-accent-text">Uploaded</span>
              ) : (
                <progress className="w-28" value={item.progress} max={1} aria-label={`Uploading ${item.name}`} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
