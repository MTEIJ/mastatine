"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteDocuments, moveDocuments } from "@/app/(pages)/admin/documents/actions";
import { DOCUMENT_CATEGORIES, categoryLabel, formatSize, type DocumentCategory, type DocumentRow } from "@/lib/document-folders";
import DetailsDialog from "./DetailsDialog";
import { DownloadIcon, EditIcon, FileIcon, FolderIcon, GlobeIcon, LockIcon, SearchIcon } from "./FileIcons";
import PreviewDialog from "./PreviewDialog";
import UploadZone from "./UploadZone";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { buttonClass, cardClass } from "@/components/ui/classes";

type Folder = DocumentCategory | "all";
type SortKey = "name" | "date" | "size";

interface FileManagerProps {
  files: DocumentRow[];
  /** Admins can upload, move, rename and delete; everyone else can only browse and read. */
  canManage: boolean;
}

const DRAG_TYPE = "application/x-mastatine-documents";

const COMPARE: Record<SortKey, (a: DocumentRow, b: DocumentRow) => number> = {
  name: (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base", numeric: true }),
  date: (a, b) => a.document_date.localeCompare(b.document_date),
  size: (a, b) => a.size_bytes - b.size_bytes,
};

/** Folders on the left, files on the right: search, sort, preview in an overlay, and for admins upload, drag to move and delete. */
export default function FileManager({ files, canManage }: FileManagerProps) {
  const router = useRouter();
  const [folder, setFolder] = useState<Folder>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; descending: boolean }>({ key: "date", descending: true });
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<Folder | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = files.filter(
      (f) => (folder === "all" || f.category === folder) && (!q || `${f.title} ${f.description} ${f.original_name}`.toLowerCase().includes(q)),
    );
    const compare = COMPARE[sort.key];
    return rows.toSorted((a, b) => (sort.descending ? compare(b, a) : compare(a, b)));
  }, [files, folder, query, sort]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files) map.set(f.category, (map.get(f.category) ?? 0) + 1);
    return map;
  }, [files]);

  const folders = DOCUMENT_CATEGORIES.filter((c) => canManage || (counts.get(c.value) ?? 0) > 0);
  const previewIndex = visible.findIndex((f) => f.id === previewId);
  const preview = previewIndex >= 0 ? visible[previewIndex] : null;
  const details = files.find((f) => f.id === detailsId) ?? null;
  const uploadFolder: DocumentCategory = folder === "all" ? "other" : folder;

  const step = useCallback(
    (delta: -1 | 1) => {
      if (visible.length === 0) return;
      const from = visible.findIndex((f) => f.id === previewId);
      setPreviewId(visible[(from + delta + visible.length) % visible.length].id);
    },
    [visible, previewId],
  );

  const run = (task: () => Promise<void>, done: string) =>
    startTransition(async () => {
      try {
        await task();
        setStatus(done);
      } catch {
        setStatus("That did not work. Reload the page and try again.");
      }
    });

  const move = (ids: string[], category: DocumentCategory) => {
    setSelected(new Set());
    run(() => moveDocuments(ids, category), `Moved ${ids.length === 1 ? "1 file" : `${ids.length} files`} to ${categoryLabel(category)}.`);
  };

  const remove = (ids: string[], what: string) => {
    if (!window.confirm(`Delete ${what}? The ${ids.length === 1 ? "file is" : "files are"} removed for good.`)) return;
    setSelected(new Set());
    setDetailsId(null);
    run(() => deleteDocuments(ids), `Deleted ${ids.length === 1 ? "1 file" : `${ids.length} files`}.`);
  };

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const allSelected = visible.length > 0 && visible.every((f) => selected.has(f.id));
  const sortBy = (key: SortKey) => setSort((s) => ({ key, descending: s.key === key ? !s.descending : key === "date" }));
  const ariaSort = (key: SortKey) => (sort.key === key ? (sort.descending ? "descending" : "ascending") : "none");
  const arrow = (key: SortKey) => (sort.key === key ? (sort.descending ? " ↓" : " ↑") : "");

  const folderButton = (value: Folder, label: string, count: number, needsFile = false) => (
    <li key={value}>
      <button
        type="button"
        aria-current={folder === value ? "true" : undefined}
        onClick={() => setFolder(value)}
        onDragOver={(event) => {
          if (!canManage || value === "all" || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
          event.preventDefault();
          setDropTarget(value);
        }}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(event) => {
          setDropTarget(null);
          const raw = event.dataTransfer.getData(DRAG_TYPE);
          if (!canManage || value === "all" || !raw) return;
          event.preventDefault();
          move(JSON.parse(raw) as string[], value);
        }}
        className={`flex w-full items-center gap-2 whitespace-nowrap rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-soft aria-[current=true]:bg-accent-soft aria-[current=true]:font-bold aria-[current=true]:text-accent-text ${dropTarget === value ? "bg-accent-soft ring-2 ring-accent" : ""}`}
      >
        <FolderIcon size={17} className="shrink-0" />
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {needsFile && <span className="rounded-full bg-danger/10 px-1.5 text-xs font-bold text-danger" title="Nothing here yet">needs a file</span>}
        <span className="text-xs tabular-nums text-muted">{count}</span>
      </button>
    </li>
  );

  const th = "px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-muted";
  const sortHeader = (key: SortKey, label: string, hide = "") => (
    <th scope="col" aria-sort={ariaSort(key)} className={`${th} ${hide}`}>
      <button type="button" onClick={() => sortBy(key)} className="uppercase tracking-wide hover:text-ink">{label}{arrow(key)}</button>
    </th>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
      <nav aria-label="Folders">
        <ul className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {folderButton("all", "All files", files.length)}
          {folders.map((c) => folderButton(c.value, c.label, counts.get(c.value) ?? 0, canManage && c.expected && !counts.has(c.value)))}
        </ul>
      </nav>

      <section aria-label="Files" className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-extrabold">{folder === "all" ? "All files" : categoryLabel(folder)}</h2>
          <label className="relative block min-w-0 flex-1 sm:max-w-xs sm:flex-none">
            <span className="sr-only">Search files</span>
            <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files" className="!pl-9" autoComplete="off" />
          </label>
        </div>

        {canManage && <UploadZone folder={uploadFolder} onFinished={() => router.refresh()} />}

        {canManage && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md bg-accent-soft px-3 py-2 text-sm">
            <span className="font-bold">{selected.size} selected</span>
            <label className="flex items-center gap-1.5">
              <span className="sr-only">Move selected files to</span>
              <Select className="!min-h-9 !py-1" value="" onChange={(e) => e.target.value && move([...selected], e.target.value as DocumentCategory)}>
                <option value="">Move to…</option>
                {DOCUMENT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </label>
            <Button type="button" variant="secondary" size="sm" className="!min-h-9" onClick={() => remove([...selected], `${selected.size} selected ${selected.size === 1 ? "file" : "files"}`)}>Delete</Button>
            <Button type="button" variant="ghost" size="sm" className="!min-h-9" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        )}

        <p role="status" className="min-h-5 text-sm text-muted" aria-live="polite">{pending ? "Working…" : status}</p>

        {visible.length === 0 ? (
          <p className={cardClass("p-6 text-center text-muted")}>
            {query ? "No files match your search." : folder === "all" ? "No documents yet." : "This folder is empty."}
          </p>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line">
                <tr>
                  {canManage && (
                    <th scope="col" className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Select all files shown"
                        checked={allSelected}
                        onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((f) => f.id)))}
                      />
                    </th>
                  )}
                  {sortHeader("name", "Name")}
                  <th scope="col" className={`${th} hidden lg:table-cell`}>Folder</th>
                  {sortHeader("date", "Date", "hidden sm:table-cell")}
                  {sortHeader("size", "Size", "hidden md:table-cell")}
                  <th scope="col" className={`${th} hidden sm:table-cell`}>Access</th>
                  <th scope="col" className="w-24 px-3 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.map((f) => (
                  <tr
                    key={f.id}
                    draggable={canManage}
                    onDragStart={(event) => {
                      const ids = selected.has(f.id) ? [...selected] : [f.id];
                      event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(ids));
                      event.dataTransfer.effectAllowed = "move";
                    }}
                    onDoubleClick={() => setPreviewId(f.id)}
                    className={selected.has(f.id) ? "bg-accent-soft" : "hover:bg-soft"}
                  >
                    {canManage && (
                      <td className="px-3 py-2">
                        <input type="checkbox" aria-label={`Select ${f.title}`} checked={selected.has(f.id)} onChange={() => toggle(f.id)} />
                      </td>
                    )}
                    <td className="max-w-0 px-3 py-2">
                      <button type="button" onClick={() => setPreviewId(f.id)} className="flex w-full min-w-0 items-center gap-2 text-left" aria-haspopup="dialog">
                        <FileIcon size={20} className="shrink-0 text-accent-text" />
                        <span className="min-w-0">
                          <span className="block truncate font-bold hover:text-accent-text">{f.title}</span>
                          <span className="block truncate text-xs text-muted">
                            {f.version_label && `${f.version_label} · `}
                            {f.description || f.original_name}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="hidden px-3 py-2 text-muted lg:table-cell">{categoryLabel(f.category)}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2 text-muted sm:table-cell">{f.document_date}</td>
                    <td className="hidden whitespace-nowrap px-3 py-2 text-muted md:table-cell">{formatSize(f.size_bytes)}</td>
                    <td className="hidden px-3 py-2 sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-muted" title={f.visibility === "public" ? "Anyone can read this" : "Signed-in members only"}>
                        {f.visibility === "public" ? <GlobeIcon size={14} /> : <LockIcon size={14} />}
                        {f.visibility === "public" ? "Public" : "Members"}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-end gap-1">
                        <a href={`/documents/${f.id}?download=1`} className={buttonClass({ variant: "ghost", size: "sm" }, "!min-h-9 !px-2")} aria-label={`Download ${f.title}`} title="Download"><DownloadIcon size={17} /></a>
                        {canManage && (
                          <Button type="button" variant="ghost" size="sm" className="!min-h-9 !px-2" aria-label={`Details of ${f.title}`} title="Details" onClick={() => setDetailsId(f.id)}><EditIcon size={17} /></Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
        <p className="text-xs text-muted">
          {visible.length} {visible.length === 1 ? "file" : "files"}
          {canManage && " · double-click or press a name to preview, drag files onto a folder to move them"}
        </p>
      </section>

      <PreviewDialog
        doc={preview}
        index={previewIndex}
        count={visible.length}
        onStep={step}
        onClose={() => setPreviewId(null)}
        onEdit={canManage ? (doc) => { setPreviewId(null); setDetailsId(doc.id); } : undefined}
      />
      {canManage && (
        <DetailsDialog
          doc={details}
          onClose={() => setDetailsId(null)}
          onSaved={() => { setDetailsId(null); setStatus("Saved."); router.refresh(); }}
          onDelete={(doc) => remove([doc.id], `“${doc.title}”`)}
        />
      )}
    </div>
  );
}
