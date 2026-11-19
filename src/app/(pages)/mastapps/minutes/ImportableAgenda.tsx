"use client";

import { useEffect, useState } from "react";
import AgendaEditor, { type AgendaDraftItem } from "./AgendaEditor";
import { Button } from "@/components/ui/Button";

interface PreviousAgenda {
  label: string;
  items: AgendaDraftItem[];
}

interface ImportableAgendaProps {
  initialItems: AgendaDraftItem[];
  /** The latest agenda per committee id. */
  previous: Record<string, PreviousAgenda>;
}

/** The agenda editor plus a button that replaces its items with the previous meeting's agenda of the chosen committee. */
export default function ImportableAgenda({ initialItems, previous }: ImportableAgendaProps) {
  const [committeeId, setCommitteeId] = useState("");
  const [draft, setDraft] = useState({ items: initialItems, version: 0 });

  // The committee select lives in the server-rendered form around this component.
  useEffect(() => {
    const select = document.getElementById("committee_id") as HTMLSelectElement | null;
    if (!select) return;
    const sync = () => setCommitteeId(select.value);
    sync();
    select.addEventListener("change", sync);
    return () => select.removeEventListener("change", sync);
  }, []);

  const available = previous[committeeId];

  return (
    <div>
      {available && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-md bg-soft px-4 py-3">
          <p className="min-w-0 flex-1 text-sm">Previous agenda: <strong>{available.label}</strong></p>
          <Button type="button" variant="secondary" size="sm" onClick={() => setDraft((d) => ({ items: available.items, version: d.version + 1 }))}>
            Import it
          </Button>
        </div>
      )}
      <AgendaEditor key={draft.version} initialItems={draft.items} />
    </div>
  );
}
