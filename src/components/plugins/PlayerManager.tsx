import CopyField from "./CopyField";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export interface PlayerRow {
  id: string;
  name: string;
  /** Short status after the name, e.g. "12" or "failed on day 3". */
  detail: string;
  /** Personal link, when players change their own entry. */
  link: string | null;
}

type FormAction = (formData: FormData) => Promise<void>;

interface PlayerManagerProps {
  instanceId: string;
  rows: PlayerRow[];
  max: number;
  maxName: number;
  addAction: FormAction;
  importAction: FormAction;
  removeAction: FormAction;
  /** Name of the form field that carries the row id to removeAction. */
  removeField: string;
  /** One line about who can see the names. */
  hint: string;
}

/** The player list of a plugin, for organisers: add by name, add all subscribers, copy personal links, remove. */
export default function PlayerManager({ instanceId, rows, max, maxName, addAction, importAction, removeAction, removeField, hint }: PlayerManagerProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-extrabold">Players <span className="font-normal text-muted">({rows.length}/{max})</span></h3>
        <form action={importAction}>
          <input type="hidden" name="instance" value={instanceId} />
          <Button variant="secondary" size="sm" type="submit">Add everyone who subscribed</Button>
        </form>
      </div>

      <form action={addAction} className="flex gap-2">
        <input type="hidden" name="instance" value={instanceId} />
        <Input className="min-w-0 flex-1" name="name" maxLength={maxName} required autoComplete="off" placeholder="Name of a new player" aria-label="Name of a new player" />
        <Button variant="secondary" size="sm" className="shrink-0" type="submit">Add</Button>
      </form>

      {rows.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <span className="min-w-0 flex-1 truncate font-bold">
                {row.name} <span className="font-normal text-muted tabular-nums">· {row.detail}</span>
              </span>
              {row.link && <CopyField compact value={row.link} label={`Personal link for ${row.name}`} />}
              <form action={removeAction}>
                <input type="hidden" name="instance" value={instanceId} />
                <input type="hidden" name={removeField} value={row.id} />
                <Button variant="secondary" size="sm" type="submit" aria-label={`Remove ${row.name}`}>Remove</Button>
              </form>
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-muted">{hint}</p>
    </div>
  );
}
