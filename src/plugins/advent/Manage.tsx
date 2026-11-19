import LinkRow from "@/components/plugins/LinkRow";
import PlayerManager from "@/components/plugins/PlayerManager";
import { siteUrl } from "@/lib/env";
import { MAX_NAME } from "../scoreboard/logic";
import type { PluginInstance } from "../types";
import { addWalkerAction, importSubscribersAction, removeWalkerAction } from "./actions";
import { MAX_WALKERS, type AdventConfig } from "./logic";
import { getWalkers } from "./store";

/** Walker management for organisers: the screen link, add by name, import the subscribers, remove, and (in 'self' mode) personal links. */
export default async function Manage({ instance, config }: { instance: PluginInstance; config: AdventConfig }) {
  const walkers = await getWalkers(instance.id);
  const origin = siteUrl();

  return (
    <div className="space-y-6">
      <LinkRow
        label="Screen link"
        value={`${origin}/p/${instance.public_token}?view=screen`}
        hint="For a TV in the room: the map full screen, read-only, refreshing every 20 seconds. Press F11 for full screen."
      />
      <PlayerManager
        instanceId={instance.id}
        rows={walkers.map((w) => ({
          id: w.id,
          name: w.name,
          detail: w.diedOn !== null ? `failed on day ${w.diedOn}` : config.movement === "auto" ? "in the game" : `day ${w.day}`,
          link: config.editMode === "self" ? `${origin}/p/${instance.public_token}?p=${w.editKey}` : null,
        }))}
        max={MAX_WALKERS}
        maxName={MAX_NAME}
        addAction={addWalkerAction}
        importAction={importSubscribersAction}
        removeAction={removeWalkerAction}
        removeField="walker"
        hint="Anyone with the public link sees the map, so the first names of subscribers become visible to them. Dead players can be revived on the public page while you are signed in."
      />
    </div>
  );
}
