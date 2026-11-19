import CopyField from "@/components/plugins/CopyField";
import { siteUrl } from "@/lib/env";
import { MAX_NAME } from "../scoreboard/logic";
import type { PluginInstance } from "../types";
import { addWalkerAction, importSubscribersAction, removeWalkerAction } from "./actions";
import { MAX_WALKERS, type AdventConfig } from "./logic";
import { getWalkers } from "./store";

/** Walker management for organisers: add by name, import the subscribers, remove, and (in 'self' mode) hand out personal links. */
export default async function Manage({ instance, config }: { instance: PluginInstance; config: AdventConfig }) {
  const walkers = await getWalkers(instance.id);
  const origin = siteUrl();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="label">Screen link (for a TV in the room)</p>
        <CopyField value={`${origin}/p/${instance.public_token}?view=screen`} label="Screen link" />
        <p className="text-sm text-muted">
          The map full screen with the day, the counts, who leads and the latest moves. Read-only and without site branding;
          it refreshes itself every 20 seconds. Press F11 in the browser for full screen.
        </p>
      </div>

      <h4 className="font-extrabold">Players ({walkers.length}/{MAX_WALKERS})</h4>
      <div className="flex flex-wrap items-end gap-3">
        <form action={addWalkerAction} className="flex flex-wrap items-end gap-2">
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
        <p className="w-full text-sm text-muted">The map is visible to anyone with the public link, so first names of subscribers become visible to them. Players show as initials in a coloured token. Dead players can be revived on the public page while you are signed in.</p>
      </div>

      {walkers.length > 0 && (
        <ul className="space-y-3">
          {walkers.map((w) => (
            <li key={w.id} className="rounded-xl border border-line p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold">
                  {w.name} <span className="font-normal text-muted">· {w.diedOn !== null ? `failed on day ${w.diedOn}` : config.movement === "auto" ? "in the game" : `day ${w.day}`}</span>
                </span>
                <form action={removeWalkerAction}>
                  <input type="hidden" name="instance" value={instance.id} />
                  <input type="hidden" name="walker" value={w.id} />
                  <button className="btn btn-secondary btn-sm" type="submit">Remove</button>
                </form>
              </div>
              {config.editMode === "self" && (
                <div className="mt-2">
                  <CopyField value={`${origin}/p/${instance.public_token}?p=${w.editKey}`} label={`Personal link for ${w.name}`} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
