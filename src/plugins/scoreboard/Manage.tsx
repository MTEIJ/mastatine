import CopyField from "@/components/plugins/CopyField";
import { siteUrl } from "@/lib/env";
import type { PluginInstance } from "../types";
import { addPlayerAction, importSubscribersAction, removePlayerAction } from "./actions";
import { MAX_NAME, MAX_PLAYERS, type ScoreboardConfig } from "./logic";
import { getPlayers } from "./store";

/** Player management for organisers: add by name, import the subscribers, remove, and (in 'self' mode) hand out personal links. */
export default async function Manage({ instance, config }: { instance: PluginInstance; config: ScoreboardConfig }) {
  const players = await getPlayers(instance.id, config.startScore);
  const origin = siteUrl();

  return (
    <div className="space-y-4">
      <h4 className="font-extrabold">Players ({players.length}/{MAX_PLAYERS})</h4>
      <div className="flex flex-wrap items-end gap-3">
        <form action={addPlayerAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="instance" value={instance.id} />
          <label className="block">
            <span className="label">Add a player</span>
            <input className="input" name="name" maxLength={MAX_NAME} required autoComplete="off" />
          </label>
          <button className="btn btn-secondary btn-sm" type="submit">Add</button>
        </form>
        <form action={importSubscribersAction}>
          <input type="hidden" name="instance" value={instance.id} />
          <button className="btn btn-secondary btn-sm" type="submit">Add everyone who subscribed</button>
        </form>
        <p className="w-full text-sm text-muted">The board is visible to anyone with the public link, so first names of subscribers become visible to them.</p>
      </div>

      {players.length > 0 && (
        <ul className="space-y-3">
          {players.map((p) => (
            <li key={p.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">{p.name} <span className="font-normal text-muted tabular-nums">· {p.marks}</span></span>
                <form action={removePlayerAction}>
                  <input type="hidden" name="instance" value={instance.id} />
                  <input type="hidden" name="player" value={p.id} />
                  <button className="btn btn-secondary btn-sm" type="submit">Remove</button>
                </form>
              </div>
              {config.editMode === "self" && (
                <div className="mt-2">
                  <CopyField value={`${origin}/p/${instance.public_token}?p=${p.editKey}`} label={`Personal link for ${p.name}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
