import type { Metadata } from "next";
import AppFrame from "@/components/ui/AppFrame";
import { getUsageCounts } from "@/lib/plugin-instances";
import { requireUser } from "@/lib/session";
import { PLUGINS } from "@/plugins/registry";

export const metadata: Metadata = { title: "Plugin library", robots: { index: false } };

export const instant = false;

export default async function PluginLibraryPage() {
  await requireUser();
  const usage = await getUsageCounts();

  return (
    <AppFrame title="Plugin library" tagline="Extra tools you can switch on for an activity. Open an activity, choose Plugins, and add one.">
      <ul className="grid gap-4 sm:grid-cols-2">
        {PLUGINS.map((plugin) => {
          const used = usage.get(plugin.id) ?? 0;
          return (
            <li key={plugin.id} className="card space-y-2 p-5">
              <h2 className="text-xl font-extrabold">{plugin.name}</h2>
              <p className="text-sm">{plugin.description}</p>
              <ul className="flex flex-wrap gap-2 text-sm font-bold">
                {plugin.PublicPage && <li className="rounded-full bg-soft px-3 py-1">Public page</li>}
                {plugin.onEvent && <li className="rounded-full bg-soft px-3 py-1">Reacts to signups</li>}
                <li className="rounded-full bg-soft px-3 py-1">Used on {used} {used === 1 ? "activity" : "activities"}</li>
              </ul>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-sm text-muted">New plugins are added by the developers. See docs/plugins.md in the repository.</p>
    </AppFrame>
  );
}
