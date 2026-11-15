import { cacheLife, cacheTag } from "next/cache";
import { getUpcomingActivities, type UpcomingActivity } from "@/lib/activities";

/**
 * The next few activities, shared by the sidebar agenda and the homepage highlight, so they run on nearly every page view.
 * Cached for a short while per audience; activity edits call `updateTag("activities")` (see the activities actions).
 */
export async function getCachedUpcomingActivities(limit: number, isMember: boolean): Promise<UpcomingActivity[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("activities");
  return Array.from(await getUpcomingActivities(limit, isMember));
}
