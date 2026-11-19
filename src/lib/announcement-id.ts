import { createHash } from "node:crypto";

/**
 * The id a visitor's dismissal is stored under. It is built from what the bar shows, so the bar returns only when the
 * message itself changes: a new post, an edited title or summary, a different link. Re-saving the same text keeps it closed.
 */
export function announcementId(kind: string, title: string, summary: string, href: string | null): string {
  const digest = createHash("sha256").update(JSON.stringify([title, summary, href ?? ""])).digest("hex").slice(0, 16);
  return `${kind}-${digest}`;
}
