import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AppFrame from "@/components/ui/AppFrame";
import { getActivity } from "@/lib/activities";
import { getPluginViewer } from "@/lib/plugin-access";
import { MAX_PLUGINS_PER_ACTIVITY, getInstances } from "@/lib/plugin-instances";
import { requireUser } from "@/lib/session";
import { PLUGINS, resolvePlugin } from "@/plugins/registry";
import { addPlugin } from "./actions";
import StatusBadge from "./StatusBadge";
import { Button } from "@/components/ui/Button";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Activity plugins", robots: { index: false } };

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
}

/** The plugins of one activity as a short list; each plugin opens on its own page (./[instance]). */
export default async function ActivityPluginsPage(props: PageProps) {
  const { user } = await requireUser();
  const { id } = await props.params;
  const activity = /^[0-9a-f-]{36}$/i.test(id) ? await getActivity(id, user.id) : null;
  if (!activity || !(await getPluginViewer(activity.id)).isManager) notFound();

  const instances = await getInstances(activity.id);
  const full = instances.length >= MAX_PLUGINS_PER_ACTIVITY;

  return (
    <AppFrame title={`Plugins for ${activity.name}`} tagline="Extra tools for this activity.">
      <div className="space-y-5">
        <section className={cardClass("p-5 sm:p-6")} aria-labelledby="installed-title">
          <h2 id="installed-title" className="text-lg font-extrabold">On this activity</h2>
          {instances.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No plugins yet. Add one below.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line border-y border-line">
              {instances.map((instance) => {
                const resolved = resolvePlugin(instance);
                return (
                  <li key={instance.id}>
                    <Link
                      href={`/mastapps/activities/${activity.id}/plugins/${instance.id}`}
                      className="-mx-2 flex items-center justify-between gap-3 rounded-sm px-2 py-3 hover:bg-soft"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-bold">{resolved?.plugin.name ?? `Unknown plugin “${instance.plugin_id}”`}</span>
                        {resolved && <StatusBadge enabled={instance.enabled} />}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-muted" aria-hidden>Open →</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className={cardClass("p-5 sm:p-6")} aria-labelledby="add-title">
          <h2 id="add-title" className="text-lg font-extrabold">Add a plugin</h2>
          {full && <p className="mt-1 text-sm font-bold">This activity has the maximum of {MAX_PLUGINS_PER_ACTIVITY} plugins. Remove one to add another.</p>}
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {PLUGINS.map((plugin) => (
              <li key={plugin.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-bold">{plugin.name}</p>
                  <p className="text-sm text-muted">{plugin.description}</p>
                </div>
                <form action={addPlugin} className="shrink-0">
                  <input type="hidden" name="activity" value={activity.id} />
                  <input type="hidden" name="plugin" value={plugin.id} />
                  <Button variant="primary" size="sm" type="submit" disabled={full}>Add</Button>
                </form>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">Missing something? <Link href="/mastapps/plugins" className="underline">See the plugin library</Link>.</p>
        </section>

        <Link href={`/mastapps/activities/${activity.id}`} className={buttonClass({ variant: "secondary" })}>Back to the activity</Link>
      </div>
    </AppFrame>
  );
}
