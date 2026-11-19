import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/ConfirmButton";
import LinkRow from "@/components/plugins/LinkRow";
import PluginSettingsForm from "@/components/plugins/PluginSettingsForm";
import AppFrame from "@/components/ui/AppFrame";
import { getActivity } from "@/lib/activities";
import { siteUrl } from "@/lib/env";
import { getPluginViewer } from "@/lib/plugin-access";
import { MAX_PLUGINS_PER_ACTIVITY, getInstances } from "@/lib/plugin-instances";
import { requireUser } from "@/lib/session";
import type { PluginInstance } from "@/plugins/types";
import { PLUGINS, resolvePlugin } from "@/plugins/registry";
import { addPlugin, newLink, removePlugin, toggleEnabled } from "./actions";

export const metadata: Metadata = { title: "Activity plugins", robots: { index: false } };

export const instant = false;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string | string[] }>;
}

export default async function ActivityPluginsPage(props: PageProps) {
  const { user } = await requireUser();
  const [{ id }, search] = await Promise.all([props.params, props.searchParams]);
  const activity = /^[0-9a-f-]{36}$/i.test(id) ? await getActivity(id, user.id) : null;
  if (!activity || !(await getPluginViewer(activity.id)).isManager) notFound();

  const instances = await getInstances(activity.id);
  const justAdded = typeof search.new === "string" ? search.new : null;
  const full = instances.length >= MAX_PLUGINS_PER_ACTIVITY;

  return (
    <AppFrame title={`Plugins for ${activity.name}`} tagline="Extra tools for this activity.">
      <div className="space-y-5">
        {instances.length === 0 && <p className="text-muted">No plugins yet. Add one below.</p>}

        {instances.map((instance) => (
          <InstanceCard key={instance.id} instance={instance} settingsOpen={instance.id === justAdded} />
        ))}

        <section className="card p-5 sm:p-6" aria-labelledby="add-title">
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
                  <button className="btn btn-primary btn-sm" type="submit" disabled={full}>Add</button>
                </form>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-muted">Missing something? <Link href="/mastapps/plugins" className="underline">See the plugin library</Link>.</p>
        </section>

        <Link href={`/mastapps/activities/${activity.id}`} className="btn btn-secondary">Back to the activity</Link>
      </div>
    </AppFrame>
  );
}

/** One installed plugin: name and actions in the header, then its links, its own tools, and the folded settings. */
function InstanceCard({ instance, settingsOpen }: { instance: PluginInstance; settingsOpen: boolean }) {
  const resolved = resolvePlugin(instance);
  const name = resolved?.plugin.name ?? `Unknown plugin “${instance.plugin_id}”`;

  return (
    <section id={`plugin-${instance.id}`} className="card scroll-mt-24 p-0" aria-label={name}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3 sm:px-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold">
          {name}
          {resolved && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${instance.enabled ? "bg-accent-soft text-accent-text" : "bg-soft text-muted"}`}>
              {instance.enabled ? "On" : "Off"}
            </span>
          )}
        </h2>
        <div className="flex gap-2">
          {resolved && (
            <form action={toggleEnabled}>
              <input type="hidden" name="instance" value={instance.id} />
              <button className="btn btn-secondary btn-sm" type="submit">{instance.enabled ? "Switch off" : "Switch on"}</button>
            </form>
          )}
          <form action={removePlugin}>
            <input type="hidden" name="instance" value={instance.id} />
            <ConfirmButton message={`Remove ${resolved?.plugin.name ?? "this plugin"} and all its data from this activity?`} className="btn btn-secondary btn-sm">
              Remove
            </ConfirmButton>
          </form>
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        {resolved ? <InstanceBody instance={instance} resolved={resolved} settingsOpen={settingsOpen} /> : (
          <p className="text-sm text-muted">This plugin is no longer part of the site. You can remove it.</p>
        )}
      </div>
    </section>
  );
}

function InstanceBody({ instance, resolved, settingsOpen }: { instance: PluginInstance; resolved: NonNullable<ReturnType<typeof resolvePlugin>>; settingsOpen: boolean }) {
  const { plugin, config } = resolved;
  return (
    <>
      {plugin.PublicPage && (
        <LinkRow label="Public link" value={`${siteUrl()}/p/${instance.public_token}`} hint="Works without signing in. A new link stops the current one.">
          <form action={newLink}>
            <input type="hidden" name="instance" value={instance.id} />
            <ConfirmButton message="Create a new link? The current link stops working." className="btn btn-secondary btn-sm">New link</ConfirmButton>
          </form>
        </LinkRow>
      )}

      {plugin.Manage && <plugin.Manage instance={instance} config={config} />}

      <details className="fold" open={settingsOpen}>
        <summary>Settings</summary>
        <div className="fold__body">
          <PluginSettingsForm instanceId={instance.id}>
            <plugin.ConfigFields config={config} />
          </PluginSettingsForm>
        </div>
      </details>
    </>
  );
}
