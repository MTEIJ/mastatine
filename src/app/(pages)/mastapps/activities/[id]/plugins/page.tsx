import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ConfirmButton from "@/components/admin/ConfirmButton";
import CopyField from "@/components/plugins/CopyField";
import PluginSettingsForm from "@/components/plugins/PluginSettingsForm";
import AppFrame from "@/components/ui/AppFrame";
import { getActivity } from "@/lib/activities";
import { siteUrl } from "@/lib/env";
import { getPluginViewer } from "@/lib/plugin-access";
import { MAX_PLUGINS_PER_ACTIVITY, getInstances } from "@/lib/plugin-instances";
import { requireUser } from "@/lib/session";
import { PLUGINS, resolvePlugin } from "@/plugins/registry";
import { addPlugin, newLink, removePlugin, toggleEnabled } from "./actions";

export const metadata: Metadata = { title: "Activity plugins", robots: { index: false } };

export const instant = false;

export default async function ActivityPluginsPage(props: { params: Promise<{ id: string }> }) {
  const { user } = await requireUser();
  const { id } = await props.params;
  const activity = /^[0-9a-f-]{36}$/i.test(id) ? await getActivity(id, user.id) : null;
  if (!activity || !(await getPluginViewer(activity.id)).isManager) notFound();

  const instances = await getInstances(activity.id);
  const origin = siteUrl();

  return (
    <AppFrame title={`Plugins for ${activity.name}`} tagline="Extra tools for this activity.">
      <div className="space-y-6">
        {instances.length === 0 && <p className="text-muted">No plugins yet. Pick one below.</p>}

        {instances.map((instance) => {
          const resolved = resolvePlugin(instance);
          if (!resolved) {
            return (
              <section key={instance.id} className="card space-y-3 p-5">
                <p className="font-bold">Unknown plugin &ldquo;{instance.plugin_id}&rdquo;</p>
                <p className="text-sm text-muted">This plugin is no longer part of the site. You can remove it.</p>
                <form action={removePlugin}>
                  <input type="hidden" name="instance" value={instance.id} />
                  <ConfirmButton message="Remove this plugin and all its data?" className="btn btn-secondary btn-sm">Remove</ConfirmButton>
                </form>
              </section>
            );
          }
          const { plugin, config } = resolved;
          return (
            <section key={instance.id} className="card space-y-5 p-5 sm:p-6">
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold">{plugin.name}{!instance.enabled && <span className="ml-2 text-sm font-bold text-muted">(switched off)</span>}</h2>
                <div className="flex flex-wrap gap-2">
                  <form action={toggleEnabled}>
                    <input type="hidden" name="instance" value={instance.id} />
                    <button className="btn btn-secondary btn-sm" type="submit">{instance.enabled ? "Switch off" : "Switch on"}</button>
                  </form>
                  <form action={removePlugin}>
                    <input type="hidden" name="instance" value={instance.id} />
                    <ConfirmButton message={`Remove ${plugin.name} and all its data from this activity?`} className="btn btn-secondary btn-sm">Remove</ConfirmButton>
                  </form>
                </div>
              </header>

              {plugin.PublicPage && (
                <div className="space-y-2">
                  <p className="label">Public link (no login needed)</p>
                  <CopyField value={`${origin}/p/${instance.public_token}`} label="Public link" />
                  <form action={newLink}>
                    <input type="hidden" name="instance" value={instance.id} />
                    <ConfirmButton message="Create a new link? The current link stops working." className="btn btn-secondary btn-sm">Create a new link</ConfirmButton>
                  </form>
                </div>
              )}

              <PluginSettingsForm instanceId={instance.id}>
                <plugin.ConfigFields config={config} />
              </PluginSettingsForm>

              {plugin.Manage && <plugin.Manage instance={instance} config={config} />}
            </section>
          );
        })}

        <section className="card space-y-3 p-5 sm:p-6">
          <h2 className="text-xl font-extrabold">Add a plugin</h2>
          {instances.length >= MAX_PLUGINS_PER_ACTIVITY && <p className="text-sm font-bold">This activity has the maximum of {MAX_PLUGINS_PER_ACTIVITY} plugins. Remove one to add another.</p>}
          <ul className="space-y-3">
            {PLUGINS.map((plugin) => (
              <li key={plugin.id} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{plugin.name}</p>
                  <p className="text-sm text-muted">{plugin.description}</p>
                </div>
                <form action={addPlugin}>
                  <input type="hidden" name="activity" value={activity.id} />
                  <input type="hidden" name="plugin" value={plugin.id} />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={instances.length >= MAX_PLUGINS_PER_ACTIVITY}>Add</button>
                </form>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">Missing something? <Link href="/mastapps/plugins" className="underline">See the plugin library</Link>.</p>
        </section>

        <Link href={`/mastapps/activities/${activity.id}`} className="btn btn-secondary">Back to the activity</Link>
      </div>
    </AppFrame>
  );
}
