"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPluginViewer } from "@/lib/plugin-access";
import { MAX_PLUGINS_PER_ACTIVITY, createInstance, deleteInstance, getInstance, getInstances, regenerateToken, setEnabled, updateConfig } from "@/lib/plugin-instances";
import { createRateLimiter } from "@/lib/rate-limit";
import { requireNamedSession } from "@/lib/session";
import { getPlugin, resolvePlugin } from "@/plugins/registry";

const limiter = createRateLimiter(60, 60 * 60 * 1000);

const uuid = z.uuid();

// Server actions are public HTTP endpoints: each one signs in and checks the committee itself, and works from the
// instance in the database, never from ids or settings the form claims.
async function managedInstance(formData: FormData) {
  const id = uuid.safeParse(formData.get("instance"));
  if (!id.success) return null;
  const instance = await getInstance(id.data);
  if (!instance) return null;
  const session = await requireNamedSession(`/mastapps/activities/${instance.activity_id}/plugins`);
  if (!limiter.allow(session.user.id)) return null;
  const viewer = await getPluginViewer(instance.activity_id);
  return viewer.isManager ? instance : null;
}

function refresh(activityId: string) {
  revalidatePath(`/mastapps/activities/${activityId}`);
  // "layout" also covers each plugin's own page below it.
  revalidatePath(`/mastapps/activities/${activityId}/plugins`, "layout");
}

export async function addPlugin(formData: FormData): Promise<void> {
  const activityId = uuid.safeParse(formData.get("activity"));
  const plugin = getPlugin(String(formData.get("plugin") ?? ""));
  if (!activityId.success || !plugin) return;
  const session = await requireNamedSession(`/mastapps/activities/${activityId.data}/plugins`);
  if (!limiter.allow(session.user.id)) return;
  if (!(await getPluginViewer(activityId.data)).isManager) return;
  if ((await getInstances(activityId.data)).length >= MAX_PLUGINS_PER_ACTIVITY) return;
  const instance = await createInstance(activityId.data, plugin.id, plugin.defaultConfig as Record<string, unknown>);
  refresh(activityId.data);
  // The new plugin starts with default settings: take the organiser straight to its page.
  redirect(`/mastapps/activities/${activityId.data}/plugins/${instance.id}`);
}

export interface SettingsState {
  error?: string;
  saved?: boolean;
}

export async function saveSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const instance = await managedInstance(formData);
  const plugin = instance && getPlugin(instance.plugin_id);
  if (!instance || !plugin) return { error: "You cannot change this plugin." };
  const parsed = plugin.configSchema.safeParse(plugin.configFromForm(formData));
  if (!parsed.success) return { error: "Some settings are not valid. Check the fields and try again." };
  const previous = resolvePlugin(instance)?.config ?? plugin.defaultConfig;
  await updateConfig(instance.id, parsed.data as Record<string, unknown>);
  try {
    await plugin.onSaved?.({ instance: { ...instance, config: parsed.data }, config: parsed.data, previous });
  } catch (error) {
    console.error(`Plugin ${instance.plugin_id} failed after saving settings:`, (error as Error).message);
  }
  refresh(instance.activity_id);
  return { saved: true };
}

export async function toggleEnabled(formData: FormData): Promise<void> {
  const instance = await managedInstance(formData);
  if (!instance) return;
  await setEnabled(instance.id, !instance.enabled);
  refresh(instance.activity_id);
}

export async function newLink(formData: FormData): Promise<void> {
  const instance = await managedInstance(formData);
  if (!instance) return;
  await regenerateToken(instance.id);
  refresh(instance.activity_id);
}

export async function removePlugin(formData: FormData): Promise<void> {
  const instance = await managedInstance(formData);
  if (!instance) return;
  await deleteInstance(instance.id);
  refresh(instance.activity_id);
  // Removing happens on the plugin's own page, which no longer exists: back to the list.
  redirect(`/mastapps/activities/${instance.activity_id}/plugins`);
}
