import type { ReactNode } from "react";
import type { ZodType } from "zod";

/** One plugin switched on for one activity. */
export interface PluginInstance {
  id: string;
  activity_id: string;
  plugin_id: string;
  config: unknown;
  public_token: string;
  position: number;
  enabled: boolean;
}

/** Who is looking, as the host sees it. Plugins get this instead of reaching into sessions themselves. */
export interface PluginViewer {
  /** Signed-in user, or null for visitors on a public page. */
  userId: string | null;
  /** Committee member of the activity, or admin. Always false on public pages without a session. */
  isManager: boolean;
}

export type PluginEvent = "subscribed" | "unsubscribed" | "waitlisted";

/**
 * What a plugin looks like. A plugin is a folder in src/plugins that default-exports one of these, plus one line in
 * registry.ts. Everything here runs on the server; plugins that need interactivity import their own client components.
 */
export interface PluginDefinition<Config = unknown> {
  /** Stable key stored in the database. Never rename it once a plugin has been used. */
  id: string;
  name: string;
  description: string;
  /** Validates settings on every save. Settings read back from the database are parsed with it too. */
  configSchema: ZodType<Config>;
  defaultConfig: Config;
  /** Turns the submitted settings form into a value for configSchema. */
  configFromForm: (form: FormData) => unknown;
  /** The settings fields; the host wraps them in a form with the save button. */
  ConfigFields: (props: { config: Config }) => ReactNode;
  /** Extra management tools beside the settings (the scoreboard's player list, for example). */
  Manage?: (props: { instance: PluginInstance; config: Config }) => ReactNode | Promise<ReactNode>;
  /** A block on the activity page, shown to everyone who can see the activity. */
  ActivitySection?: (props: { instance: PluginInstance; config: Config; viewer: PluginViewer }) => ReactNode | Promise<ReactNode>;
  /** The no-login page at /p/<token>. Without it the plugin has no public address. */
  PublicPage?: (props: { instance: PluginInstance; config: Config; viewer: PluginViewer; search: Record<string, string | undefined> }) => ReactNode | Promise<ReactNode>;
  /** Called after someone subscribes, unsubscribes or joins the waitlist (`userId` is the person, when known). Failures are logged and never block the person. */
  onEvent?: (props: { instance: PluginInstance; config: Config; event: PluginEvent; userId: string | null }) => Promise<void>;
  /** Called after an organiser saved the settings, with what they were before. Lets a plugin act on a changed option. */
  onSaved?: (props: { instance: PluginInstance; config: Config; previous: Config }) => Promise<void>;
}

/** Identity function that checks a definition against the contract while keeping its Config type. */
export function definePlugin<Config>(definition: PluginDefinition<Config>): PluginDefinition<Config> {
  return definition;
}
