import sql from "@/lib/db";

/** An agenda item that is not an activity: it only shows up in the calendar feed. */
export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  starts_at: Date;
  ends_at: Date | null;
  is_visible: boolean;
}

// Built per call: sql`` must not run at import time (`next build` has no DATABASE_URL).
const columns = () => sql`id, title, description, location, starts_at, ends_at, is_visible`;

/** Visible agenda items from the last 60 days onwards, for the public calendar feed. */
export function getFeedEvents() {
  return sql<CalendarEvent[]>`
    SELECT ${columns()} FROM calendar_events
    WHERE is_visible AND starts_at > NOW() - INTERVAL '60 days' ORDER BY starts_at LIMIT 500
  `;
}

/** Every agenda item, newest first, for the admin list. */
export function getAllEvents() {
  return sql<CalendarEvent[]>`SELECT ${columns()} FROM calendar_events ORDER BY starts_at DESC LIMIT 300`;
}

export async function getEvent(id: string): Promise<CalendarEvent | null> {
  const [row] = await sql<CalendarEvent[]>`SELECT ${columns()} FROM calendar_events WHERE id = ${id}`;
  return row ?? null;
}

/** Visible agenda items that have not ended yet, soonest first. */
export function getUpcomingEvents(limit: number) {
  return sql<CalendarEvent[]>`
    SELECT ${columns()} FROM calendar_events
    WHERE is_visible AND COALESCE(ends_at, starts_at + INTERVAL '3 hours') > NOW() ORDER BY starts_at LIMIT ${limit}
  `;
}
