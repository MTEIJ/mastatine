import { CATEGORIES } from "@/lib/finance";
import { Input, Label, Select } from "@/components/ui/Field";

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
        <Label htmlFor={field("direction")}>Money</Label>
        <Select id={field("direction")} name="direction" defaultValue={entry && entry.amount_cents < 0 ? "out" : "in"}>
          <option value="in">In</option>
          <option value="out">Out</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={field("amount")}>Amount (€)</Label>
        <Input id={field("amount")} name="amount" inputMode="decimal" required placeholder="12,50" defaultValue={entry ? euros(entry.amount_cents) : undefined} />
      </div>
      <div className="col-span-2">
        <Label htmlFor={field("date")}>Date</Label>
        <Input id={field("date")} name="occurred_on" type="date" required defaultValue={entry?.occurred_on ?? today()} max={today()} />
      </div>
      <div className="col-span-2">
        <Label htmlFor={field("category")}>Category</Label>
        <Select id={field("category")} name="category" defaultValue={entry?.category ?? "donation"}>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} ({c.direction === "either" ? "in or out" : c.direction})</option>)}
        </Select>
      </div>
      <div className="col-span-2">
        <Label htmlFor={field("description")}>What for</Label>
        <Input id={field("description")} name="description" required maxLength={300} defaultValue={entry?.description} />
      </div>
      <div className="col-span-2">
        <Label htmlFor={field("counterparty")}>From / to (optional)</Label>
        <Input id={field("counterparty")} name="counterparty" maxLength={120} placeholder="Donor or supplier" defaultValue={entry?.counterparty} />
      </div>
      <div className="col-span-2">
        <Label htmlFor={field("activity")}>Activity (optional)</Label>
        <Select id={field("activity")} name="activity_id" defaultValue={entry?.activity_id ?? ""}>
          <option value="">Not tied to an activity</option>
          {activities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
      </div>
    </div>
  );
}
