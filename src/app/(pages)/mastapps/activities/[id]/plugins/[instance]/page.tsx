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
import { getInstance } from "@/lib/plugin-instances";
import { requireUser } from "@/lib/session";
import { resolvePlugin } from "@/plugins/registry";
import { newLink, removePlugin, toggleEnabled } from "../actions";
import StatusBadge from "../StatusBadge";

export const metadata: Metadata = { title: "Plugin", robots: { index: false } };

export const instant = false;

const UUID = /^[0-9a-f-]{36}$/i;

interface PageProps {
  params: Promise<{ id: string; instance: string }>;
}

/** One plugin of an activity on its own page: its links, its own tools and its settings. */
export default async function ActivityPluginPage(props: PageProps) {
  const { user } = await requireUser();
  const { id, instance: instanceId } = await props.params;
  if (!UUID.test(id) || !UUID.test(instanceId)) notFound();
  const [activity, instance] = await Promise.all([getActivity(id, user.id), getInstance(instanceId)]);
  if (!activity || !instance || instance.activity_id !== activity.id) notFound();
  if (!(await getPluginViewer(activity.id)).isManager) notFound();

  const resolved = resolvePlugin(instance);
  const name = resolved?.plugin.name ?? `Unknown plugin “${instance.plugin_id}”`;
  const back = `/mastapps/activities/${activity.id}/plugins`;

  return (
    <AppFrame title={name} tagline={<>Plugin for <Link href={`/mastapps/activities/${activity.id}`} className="underline">{activity.name}</Link></>}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={back} className="text-sm font-bold underline">← All plugins</Link>
          <div className="flex items-center gap-2">
            {resolved && <StatusBadge enabled={instance.enabled} />}
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
        </div>

        {!resolved ? (
          <p className="card p-5 text-sm text-muted sm:p-6">This plugin is no longer part of the site. You can remove it.</p>
        ) : (
          <>
            {(resolved.plugin.PublicPage || resolved.plugin.Manage) && (
              <section className="card space-y-6 p-5 sm:p-6">
                {resolved.plugin.PublicPage && (
                  <LinkRow label="Public link" value={`${siteUrl()}/p/${instance.public_token}`} hint="Works without signing in. A new link stops the current one.">
                    <form action={newLink}>
                      <input type="hidden" name="instance" value={instance.id} />
                      <ConfirmButton message="Create a new link? The current link stops working." className="btn btn-secondary btn-sm">New link</ConfirmButton>
                    </form>
                  </LinkRow>
                )}
                {resolved.plugin.Manage && <resolved.plugin.Manage instance={instance} config={resolved.config} />}
              </section>
            )}

            <section className="card p-5 sm:p-6" aria-labelledby="settings-title">
              <h2 id="settings-title" className="mb-4 text-lg font-extrabold">Settings</h2>
              <PluginSettingsForm instanceId={instance.id}>
                <resolved.plugin.ConfigFields config={resolved.config} />
              </PluginSettingsForm>
            </section>
          </>
        )}
      </div>
    </AppFrame>
  );
}
