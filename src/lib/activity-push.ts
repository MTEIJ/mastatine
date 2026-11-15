import { formatDateTime } from "@/lib/datetime";
import { pushToEveryone, pushToUsers } from "@/lib/push";

/** Push notifications about activities, sent next to the emails. All best effort: they never throw. */

const activityPath = (id: string) => `/mastapps/activities/${id}`;

/** "Thu 19 November 20:00 · Café De Mast" */
const whenWhere = (startsAt: Date, location: string) => (location ? `${formatDateTime(startsAt)} · ${location}` : formatDateTime(startsAt));

export interface Announcement {
  id: string;
  name: string;
  starts_at: Date;
  location: string;
  members_only: boolean;
}

/** Tells everyone with notifications on (members only, for a members-only activity) that a new activity is up. */
export async function announceActivity(a: Announcement): Promise<void> {
  await pushToEveryone(
    { title: `New activity: ${a.name}`, body: `${whenWhere(a.starts_at, a.location)}. Tap to join.`, url: activityPath(a.id), tag: `new-${a.id}` },
    { membersOnly: a.members_only },
  );
}

/** The "tomorrow" reminder for the people going. */
export async function pushReminder(activityId: string, name: string, startsAt: Date, location: string, userIds: string[]): Promise<void> {
  await pushToUsers(userIds, { title: `Tomorrow: ${name}`, body: whenWhere(startsAt, location), url: activityPath(activityId), tag: `reminder-${activityId}` });
}

/** Something about an activity the people going need to know: a change, a message from the organisers. */
export async function pushToParticipants(activityId: string, userIds: string[], title: string, body: string): Promise<void> {
  await pushToUsers(userIds, { title, body, url: activityPath(activityId), tag: `update-${activityId}` });
}

/** The activity is off; the page is gone, so the notification opens the activity list. */
export async function pushCancellation(userIds: string[], name: string, startsAt: Date): Promise<void> {
  await pushToUsers(userIds, { title: `Cancelled: ${name}`, body: `The activity on ${formatDateTime(startsAt)} will not take place.`, url: "/mastapps/activities" });
}
