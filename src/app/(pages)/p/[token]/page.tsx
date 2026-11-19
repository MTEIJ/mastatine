import type { Metadata } from "next";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import { getPluginViewer } from "@/lib/plugin-access";
import { getInstanceByToken } from "@/lib/plugin-instances";
import { resolvePlugin } from "@/plugins/registry";

// The address is the secret: keep it out of search results and never pass it on in a Referer header.
const BASE_METADATA: Metadata = { title: "Activity", robots: { index: false, follow: false }, referrer: "no-referrer" };

/** On a screen view (?view=screen) the tab shows only the plugin's own title, without the site name. */
export async function generateMetadata(props: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }): Promise<Metadata> {
  const [{ token }, search] = await Promise.all([props.params, props.searchParams]);
  if (search.view !== "screen") return BASE_METADATA;
  const instance = await getInstanceByToken(token);
  const title = instance?.config && typeof instance.config === "object" && "title" in instance.config ? String(instance.config.title) : "Live";
  return { ...BASE_METADATA, title: { absolute: title } };
}

export const instant = false;

/** A plugin's public page. No login: the unguessable token in the address says which plugin instance this is. */
export default async function PublicPluginPage(props: { params: Promise<{ token: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { token } = await props.params;
  const instance = await getInstanceByToken(token);
  const resolved = instance && resolvePlugin(instance);
  if (!instance || !resolved?.plugin.PublicPage) notFound();

  const raw = await props.searchParams;
  const search = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const viewer = await getPluginViewer(instance.activity_id);

  // The activity's name is only shown when the activity itself is public: a hidden or members-only one stays private.
  const [activity] = await sql<{ name: string }[]>`SELECT name FROM activities WHERE id = ${instance.activity_id} AND is_visible AND NOT members_only`;

  // The page is standalone: the plugin renders all of it, including its own header and look.
  return <resolved.plugin.PublicPage instance={instance} config={resolved.config} viewer={viewer} search={search} activityName={activity?.name ?? null} />;
}
