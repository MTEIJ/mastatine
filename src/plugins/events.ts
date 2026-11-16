import { getInstances } from "@/lib/plugin-instances";
import { resolvePlugin } from "./registry";
import type { PluginEvent } from "./types";

/** Tells every enabled plugin of an activity what happened. One plugin failing never affects another or the caller. */
export async function dispatchPluginEvent(activityId: string, event: PluginEvent, userId: string | null = null): Promise<void> {
  try {
    const instances = await getInstances(activityId, { onlyEnabled: true });
    await Promise.all(
      instances.map(async (instance) => {
        const resolved = resolvePlugin(instance);
        if (!resolved?.plugin.onEvent) return;
        try {
          await resolved.plugin.onEvent({ instance, config: resolved.config, event, userId });
        } catch (error) {
          console.error(`Plugin ${instance.plugin_id} failed on "${event}":`, (error as Error).message);
        }
      }),
    );
  } catch (error) {
    console.error("Failed to dispatch a plugin event:", (error as Error).message);
  }
}
