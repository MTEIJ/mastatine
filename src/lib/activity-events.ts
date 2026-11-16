import sql from "@/lib/db";
import { dispatchPluginEvent } from "@/plugins/events";

export type ActivityEventKind = "subscribed" | "unsubscribed" | "waitlisted";

/** Counts a signup, unsubscribe or waitlist join for the statistics. The statistics record the activity only, never the person; the person is passed on to plugins, which run on the server. */
export async function logActivityEvent(activityId: string, kind: ActivityEventKind, userId: string | null = null): Promise<void> {
  try {
    await sql`INSERT INTO activity_events (activity_id, kind) VALUES (${activityId}, ${kind})`;
  } catch (error) {
    console.error("Failed to record an activity event:", (error as Error).message);
  }
  // Plugins hear about it after the count is stored; they never block or break the signup.
  await dispatchPluginEvent(activityId, kind, userId);
}
