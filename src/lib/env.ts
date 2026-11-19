/** Reads a required environment variable at call time (never at build time). */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

/** Public origin of the site, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export const SITE_NAME = "M.A. Mastatine";

/**
 * Invite link of the members' WhatsApp group (WHATSAPP_GROUP_URL), sent to new members. Read at runtime, so changing it
 * (for example after resetting the link in WhatsApp) only needs a restart. Null when unset, or when it is not an https
 * chat.whatsapp.com invite link: a typo must not send new members somewhere else.
 */
export function whatsappGroupUrl(value: string | undefined = process.env.WHATSAPP_GROUP_URL): string | null {
  const raw = value?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol === "https:" && url.hostname === "chat.whatsapp.com" && /^\/[A-Za-z0-9]+\/?$/.test(url.pathname)) return url.toString();
  } catch {
    // falls through to the warning
  }
  console.warn("WHATSAPP_GROUP_URL is not a https://chat.whatsapp.com/… invite link; new members get no group invite.");
  return null;
}
