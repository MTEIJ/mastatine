import { cacheLife, cacheTag } from "next/cache";
import { getUpcomingActivities } from "@/lib/activities";
import { getUpcomingEvents } from "@/lib/calendar-events";

/** One line in the sidebar agenda: an activity (has a page) or a plain agenda item (no link). */
export interface AgendaEntry {
  key: string;
  name: string;
  location: string;
  starts_at: Date;
  href: string | null;
}

/** The next activities and agenda items together, soonest first. Cached per audience; editing either calls `updateTag("activities")`. */
export async function getCachedAgenda(limit: number, isMember: boolean): Promise<AgendaEntry[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("activities");
  const [activities, events] = await Promise.all([getUpcomingActivities(limit, isMember), getUpcomingEvents(limit)]);
  const entries: AgendaEntry[] = [
    ...activities.map((a) => ({ key: a.id, name: a.name, location: a.location, starts_at: a.starts_at, href: `/mastapps/activities/${a.id}` })),
    ...events.map((e) => ({ key: `event-${e.id}`, name: e.title, location: e.location, starts_at: e.starts_at, href: null })),
  ];
  return entries.sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime()).slice(0, limit);
}
