import scoreboard from "./scoreboard";
import type { PluginDefinition, PluginInstance } from "./types";

/**
 * Every plugin the site ships with. To add one: create src/plugins/<id>/index.ts that default-exports definePlugin(...),
 * import it here and add it to the list. The library page and the "add plugin" picker read from this list.
 */
// Each plugin has its own Config type, so the list is typed loosely; typed access goes through resolvePlugin().
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PLUGINS: readonly PluginDefinition<any>[] = [scoreboard];

export const getPlugin = (id: string) => PLUGINS.find((p) => p.id === id) ?? null;

/** An instance together with its plugin and its settings, parsed defensively. Null when the plugin no longer exists. */
export function resolvePlugin(instance: PluginInstance) {
  const plugin = getPlugin(instance.plugin_id);
  if (!plugin) return null;
  const parsed = plugin.configSchema.safeParse(instance.config);
  return { plugin, config: parsed.success ? parsed.data : plugin.defaultConfig };
}
