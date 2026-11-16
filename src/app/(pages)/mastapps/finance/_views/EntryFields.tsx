import { CATEGORIES } from "@/lib/finance";

interface EntryDefaults {
  amount_cents: number;
  occurred_on: string;
  category: string;
  description: string;
  counterparty: string;
  activity_id: string | null;
}

interface EntryFieldsProps {
  /** Keeps element ids unique when several forms are on the page (one per ledger row). */
  idPrefix: string;
  activities: { id: string; name: string }[];
  /** An existing entry when editing; empty when adding. */
  entry?: EntryDefaults;
}

const today = () => new Date().toISOString().slice(0, 10);
const euros = (cents: number) => (Math.abs(cents) / 100).toFixed(2).replace(".", ",");

/** The fields of an entry, shared by "Add entry" and "Edit entry" so both validate the same way. */
export default function EntryFields({ idPrefix, activities, entry }: EntryFieldsProps) {
  const field = (name: string) => `${idPrefix}-${name}`;
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="label" htmlFor={field("direction")}>Money</label>
        <select id={field("direction")} name="direction" className="input" defaultValue={entry && entry.amount_cents < 0 ? "out" : "in"}>
          <option value="in">In</option>
          <option value="out">Out</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor={field("amount")}>Amount (€)</label>
        <input id={field("amount")} name="amount" className="input" inputMode="decimal" required placeholder="12,50" defaultValue={entry ? euros(entry.amount_cents) : undefined} />
      </div>
      <div className="col-span-2">
        <label className="label" htmlFor={field("date")}>Date</label>
        <input id={field("date")} name="occurred_on" type="date" className="input" required defaultValue={entry?.occurred_on ?? today()} max={today()} />
      </div>
      <div className="col-span-2">
        <label className="label" htmlFor={field("category")}>Category</label>
        <select id={field("category")} name="category" className="input" defaultValue={entry?.category ?? "donation"}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.direction === "either" ? "in or out" : c.direction})</option>)}
        </select>
      </div>
      <div className="col-span-2">
        <label className="label" htmlFor={field("description")}>What for</label>
        <input id={field("description")} name="description" className="input" required maxLength={300} defaultValue={entry?.description} />
      </div>
      <div className="col-span-2">
        <label className="label" htmlFor={field("counterparty")}>From / to (optional)</label>
        <input id={field("counterparty")} name="counterparty" className="input" maxLength={120} placeholder="Donor or supplier" defaultValue={entry?.counterparty} />
      </div>
      <div className="col-span-2">
        <label className="label" htmlFor={field("activity")}>Activity (optional)</label>
        <select id={field("activity")} name="activity_id" className="input" defaultValue={entry?.activity_id ?? ""}>
          <option value="">Not tied to an activity</option>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>
    </div>
  );
}
