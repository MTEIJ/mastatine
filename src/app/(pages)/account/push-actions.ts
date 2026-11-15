"use server";

import { createRateLimiter } from "@/lib/rate-limit";
import { deletePushSubscription, pushSubscriptionSchema, pushToUsers, savePushSubscription } from "@/lib/push";
import { getSession } from "@/lib/session";

export interface PushActionResult {
  ok: boolean;
  error?: string;
}

const changes = createRateLimiter(20, 60 * 60 * 1000);
const tests = createRateLimiter(5, 60 * 60 * 1000);

async function signedInUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user.id ?? null;
}

/** Remembers this device for the signed-in user, so notifications reach it. */
export async function enablePush(input: unknown): Promise<PushActionResult> {
  const userId = await signedInUserId();
  if (!userId) return { ok: false, error: "Sign in to turn on notifications." };
  if (!changes.allow(userId)) return { ok: false, error: "Too many changes. Try again later." };
  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "This browser sent an unexpected subscription." };
  try {
    await savePushSubscription(userId, parsed.data);
    return { ok: true };
  } catch (error) {
    console.error("Failed to save a push subscription:", (error as Error).message);
    return { ok: false, error: "Could not turn on notifications. Try again later." };
  }
}

/** Forgets this device. */
export async function disablePush(endpoint: unknown): Promise<PushActionResult> {
  const userId = await signedInUserId();
  if (!userId) return { ok: false, error: "Sign in first." };
  if (typeof endpoint !== "string" || endpoint.length > 1000) return { ok: false, error: "Unknown device." };
  try {
    await deletePushSubscription(userId, endpoint);
    return { ok: true };
  } catch (error) {
    console.error("Failed to delete a push subscription:", (error as Error).message);
    return { ok: false, error: "Could not turn off notifications. Try again later." };
  }
}

/** Sends a test notification to all of the user's devices. */
export async function sendTestPush(): Promise<PushActionResult> {
  const userId = await signedInUserId();
  if (!userId) return { ok: false, error: "Sign in first." };
  if (!tests.allow(userId)) return { ok: false, error: "That is enough tests for now." };
  const sent = await pushToUsers([userId], { title: "M.A. Mastatine", body: "Notifications work. See you at the next activity!", url: "/mastapps/activities", tag: "test" });
  return sent > 0 ? { ok: true } : { ok: false, error: "No device accepted the notification." };
}
