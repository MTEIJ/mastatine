import PlayerManager from "@/components/plugins/PlayerManager";
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
    <PlayerManager
      instanceId={instance.id}
      rows={players.map((p) => ({
        id: p.id,
        name: p.name,
        detail: String(p.marks),
        link: config.editMode === "self" ? `${origin}/p/${instance.public_token}?p=${p.editKey}` : null,
      }))}
      max={MAX_PLAYERS}
      maxName={MAX_NAME}
      addAction={addPlayerAction}
      importAction={importSubscribersAction}
      removeAction={removePlayerAction}
      removeField="player"
      hint="Anyone with the public link sees the board, so the first names of subscribers become visible to them."
    />
  );
}
