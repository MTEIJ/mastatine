import type { Metadata } from "next";
import Link from "next/link";
import AppFrame from "@/components/ui/AppFrame";
import { getManagedActivities } from "@/lib/activities";
import { getManagedInstances, getUsageCounts } from "@/lib/plugin-instances";
import { formatDayMonth } from "@/lib/datetime";
import { requireUser } from "@/lib/session";
import { PLUGINS, getPlugin } from "@/plugins/registry";
import { addPlugin } from "../activities/[id]/plugins/actions";

export const metadata: Metadata = { title: "Plugin library", robots: { index: false } };

export const instant = false;

const TAB = "rounded-full px-4 py-2 text-sm font-extrabold";

export default async function PluginLibraryPage(props: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { user } = await requireUser();
  const [installed, activities, usage] = await Promise.all([getManagedInstances(user), getManagedActivities(user), getUsageCounts()]);
  const { tab: rawTab } = await props.searchParams;
  const requested = Array.isArray(rawTab) ? rawTab[0] : rawTab;
  // Open on what is installed when there is something; otherwise on what could be.
  const tab = requested === "installed" || requested === "explore" ? requested : installed.length > 0 ? "installed" : "explore";
  const upcoming = activities.filter((a) => a.starts_at > new Date()).concat(activities.filter((a) => a.starts_at <= new Date()));

  return (
    <AppFrame title="Plugin library" tagline="Extra tools you can switch on for an activity.">
      <nav aria-label="Library sections" className="mb-5 flex gap-2">
        <Link href="/mastapps/plugins?tab=installed" aria-current={tab === "installed" ? "page" : undefined} className={`${TAB} ${tab === "installed" ? "bg-navy text-white" : "bg-soft"}`}>
          Installed ({installed.length})
        </Link>
        <Link href="/mastapps/plugins?tab=explore" aria-current={tab === "explore" ? "page" : undefined} className={`${TAB} ${tab === "explore" ? "bg-navy text-white" : "bg-soft"}`}>
          Explore ({PLUGINS.length})
        </Link>
      </nav>

      {tab === "installed" ? (
        installed.length === 0 ? (
          <p className="text-muted">Nothing installed on your activities yet. <Link href="/mastapps/plugins?tab=explore" className="underline">Explore the plugins</Link> to add one.</p>
        ) : (
          <ul className="space-y-3">
            {installed.map((item) => (
              <li key={item.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-extrabold">
                    {getPlugin(item.plugin_id)?.name ?? `Unknown plugin (${item.plugin_id})`}
                    {!item.enabled && <span className="ml-2 text-sm font-bold text-muted">(switched off)</span>}
                  </p>
                  <p className="text-sm text-muted">{item.activity_name} · {formatDayMonth(item.starts_at)}</p>
                </div>
                <Link href={`/mastapps/activities/${item.activity_id}/plugins`} className="btn btn-secondary btn-sm">Manage</Link>
              </li>
            ))}
          </ul>
        )
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {PLUGINS.map((plugin) => {
            const used = usage.get(plugin.id) ?? 0;
            return (
              <li key={plugin.id} className="card space-y-3 p-5">
                <h2 className="text-xl font-extrabold">{plugin.name}</h2>
                <p className="text-sm">{plugin.description}</p>
                <ul className="flex flex-wrap gap-2 text-sm font-bold">
                  {plugin.PublicPage && <li className="rounded-full bg-soft px-3 py-1">Public page</li>}
                  {plugin.onEvent && <li className="rounded-full bg-soft px-3 py-1">Reacts to signups</li>}
                  <li className="rounded-full bg-soft px-3 py-1">Used on {used} {used === 1 ? "activity" : "activities"}</li>
                </ul>
                {upcoming.length > 0 ? (
                  <form action={addPlugin} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="plugin" value={plugin.id} />
                    <label className="block min-w-0 flex-1">
                      <span className="label">Add to</span>
                      <select name="activity" className="input" required>
                        {upcoming.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                      </select>
                    </label>
                    <button className="btn btn-primary btn-sm" type="submit">Add</button>
                  </form>
                ) : (
                  <p className="text-sm text-muted">You do not organise an activity yet.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-6 text-sm text-muted">New plugins are added by the developers. See docs/plugins.md in the repository.</p>
    </AppFrame>
  );
}
