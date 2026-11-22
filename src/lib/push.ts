import webpush from "web-push";
import { z } from "zod";
import sql from "@/lib/db";
import { siteUrl } from "@/lib/env";

/**
 * Web push notifications. Optional: without VAPID keys in the environment nothing is sent and the opt-in is hidden.
 * Generate keys once with `bunx web-push generate-vapid-keys` and set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.
 */

export interface PushMessage {
  title: string;
  body: string;
  /** Site path opened when the notification is tapped. */
  url: string;
  /** Notifications with the same tag replace each other instead of piling up. */
  tag?: string;
}

/** Hosts of the browser vendors' push services; the server only ever posts to these (no arbitrary-URL requests). */
const PUSH_SERVICE_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

function isPushServiceHost(endpoint: string): boolean {
  const host = new URL(endpoint).hostname.toLowerCase();
  return PUSH_SERVICE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

/** What a browser hands over after subscribing, checked before it is stored. */
export const pushSubscriptionSchema = z.object({
  endpoint: z.url({ protocol: /^https$/ }).max(1000).refine(isPushServiceHost, "Unknown push service"),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
});
export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;

/** The public key the browser needs to subscribe, or null when push is not configured. */
export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY ? process.env.VAPID_PUBLIC_KEY : null;
}

let configured = false;
function configure(): boolean {
  const publicKey = vapidPublicKey();
  if (!publicKey) return false;
  if (!configured) {
    const subject = process.env.VAPID_SUBJECT || (siteUrl().startsWith("https:") ? siteUrl() : "mailto:noreply@mastatine.nl");
    webpush.setVapidDetails(subject, publicKey, process.env.VAPID_PRIVATE_KEY!);
    configured = true;
  }
  return true;
}

export async function savePushSubscription(userId: string, sub: PushSubscriptionInput): Promise<void> {
  // The endpoint belongs to one browser: if someone else signs in there, the device moves to their account.
  await sql`
    INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth) VALUES (${sub.endpoint}, ${userId}, ${sub.keys.p256dh}, ${sub.keys.auth})
    ON CONFLICT (endpoint) DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth
  `;
}

export async function deletePushSubscription(userId: string, endpoint: string): Promise<void> {
  await sql`DELETE FROM push_subscriptions WHERE endpoint = ${endpoint} AND user_id = ${userId}`;
}

interface Row { endpoint: string; p256dh: string; auth: string }

const BATCH = 20;

async function deliver(rows: Row[], message: PushMessage): Promise<number> {
  if (rows.length === 0 || !configure()) return 0;
  const payload = JSON.stringify(message);
  let sent = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const results = await Promise.allSettled(
      rows.slice(i, i + BATCH).map((r) => webpush.sendNotification({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }, payload, { TTL: 60 * 60 * 24 })),
    );
    const gone: string[] = [];
    results.forEach((result, j) => {
      if (result.status === "fulfilled") {
        sent += 1;
        return;
      }
      const status = (result.reason as { statusCode?: number }).statusCode;
      // 404/410: the browser dropped the subscription (uninstalled, permission revoked). Forget it.
      if (status === 404 || status === 410) gone.push(rows[i + j].endpoint);
      else console.error("Failed to send a push notification:", (result.reason as Error).message);
    });
    if (gone.length > 0) await sql`DELETE FROM push_subscriptions WHERE endpoint IN ${sql(gone)}`;
  }
  return sent;
}

/** Sends to every device of the given users. Best effort: never throws. Returns how many devices accepted it. */
export async function pushToUsers(userIds: string[], message: PushMessage): Promise<number> {
  if (userIds.length === 0 || !vapidPublicKey()) return 0;
  try {
    const rows = await sql<Row[]>`
      SELECT p.endpoint, p.p256dh, p.auth FROM push_subscriptions p JOIN "user" u ON u.id = p.user_id
      WHERE p.user_id IN ${sql(userIds)} AND NOT u.banned
    `;
    return await deliver(Array.from(rows), message);
  } catch (error) {
    console.error("Failed to send push notifications:", (error as Error).message);
    return 0;
  }
}

/** Sends to everyone with notifications on; members only when `membersOnly`. Best effort: never throws. */
export async function pushToEveryone(message: PushMessage, { membersOnly = false } = {}): Promise<number> {
  if (!vapidPublicKey()) return 0;
  try {
    const rows = await sql<Row[]>`
      SELECT p.endpoint, p.p256dh, p.auth FROM push_subscriptions p JOIN "user" u ON u.id = p.user_id
      WHERE NOT u.banned AND (${!membersOnly} OR is_member(u.id))
    `;
    return await deliver(Array.from(rows), message);
  } catch (error) {
    console.error("Failed to send push notifications:", (error as Error).message);
    return 0;
  }
}
