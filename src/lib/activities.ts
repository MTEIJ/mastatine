import sql from "@/lib/db";
import type { SignupGroup, SignupPick } from "@/lib/signup-options";

export interface Activity {
  id: string;
  committee_id: string | null;
  committee_name: string;
  name: string;
  description: string;
  location: string;
  cost_cents: number | null;
  subscription_limit: number | null;
  estimated_attendees: number | null;
  starts_at: Date;
  ends_at: Date | null;
  subscription_opens_at: Date | null;
  subscription_closes_at: Date | null;
  allow_unsubscribe: boolean;
  needs_ero: boolean;
  uses_budget: boolean;
  invite_boss: boolean;
  boss_note: string;
  invite_flitcie: boolean;
  flitcie_note: string;
  is_visible: boolean;
  /** Hidden from everyone who is not a member. */
  members_only: boolean;
  poster_url: string | null;
  created_by: string | null;
  signup_options: SignupGroup[];
  participants: number;
  subscribed: boolean;
  /** What the viewer picked and agreed to pay when subscribing (null when not subscribed). */
  my_choices: SignupPick[] | null;
  my_price_cents: number | null;
}

type Viewer = { id: string; role?: string | null };

/** `userId` is null for visitors who are not signed in: nothing is flagged as subscribed. */
const columns = (userId: string | null) => sql`
  a.*, COALESCE(c.name, 'Mastatine') AS committee_name,
  (SELECT COUNT(*) FROM activity_subscriptions s WHERE s.activity_id = a.id)::int AS participants,
  EXISTS (SELECT 1 FROM activity_subscriptions s WHERE s.activity_id = a.id AND s.user_id = ${userId}) AS subscribed,
  (SELECT s.choices FROM activity_subscriptions s WHERE s.activity_id = a.id AND s.user_id = ${userId}) AS my_choices,
  (SELECT s.price_cents FROM activity_subscriptions s WHERE s.activity_id = a.id AND s.user_id = ${userId}) AS my_price_cents
`;

/** Members-only activities are left out unless the viewer is a member. */
const audience = (isMember: boolean) => (isMember ? sql`TRUE` : sql`NOT a.members_only`);

// Fragments are built per call: sql`` must not run at import time (`next build` has no DATABASE_URL).
/** An activity counts as over once it has ended (or, without an end time, 3 hours after it started). */
const endsAt = () => sql`COALESCE(a.ends_at, a.starts_at + INTERVAL '3 hours')`;

export interface ActivityFilters {
  q: string;
  committeeId: string;
  when: "upcoming" | "past" | "";
  /** Only activities the viewer is subscribed to. */
  mine: boolean;
}

// The exact UUID shape: a looser pattern lets junk like 36 dashes through, and Postgres then rejects it with a 500.
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Reads filter fields from a query string; anything unrecognised falls back to "no filter". A repeated field (?q=a&q=b) arrives as an array: the first value wins. */
export function parseActivityFilters(params: Record<string, string | string[] | undefined>): ActivityFilters {
  const one = (name: string) => {
    const value = params[name];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const committee = one("committee");
  const when = one("when");
  return {
    q: one("q").trim().slice(0, 100),
    committeeId: ID.test(committee) ? committee : "",
    when: when === "upcoming" || when === "past" ? when : "",
    mine: one("mine") === "1",
  };
}

export const hasActivityFilters = (f: ActivityFilters): boolean => Boolean(f.q || f.committeeId || f.when || f.mine);

/** Conditions shared by the upcoming and past lists: the search text, the committee and "only mine". */
function filterConditions(userId: string | null, f: ActivityFilters) {
  const pattern = `%${f.q.replace(/[\\%_]/g, "\\$&")}%`;
  return [
    ...(f.q ? [sql`(a.name ILIKE ${pattern} OR a.description ILIKE ${pattern} OR a.location ILIKE ${pattern} OR c.name ILIKE ${pattern})`] : []),
    ...(f.committeeId ? [sql`a.committee_id = ${f.committeeId}`] : []),
    ...(f.mine && userId ? [sql`EXISTS (SELECT 1 FROM activity_subscriptions s WHERE s.activity_id = a.id AND s.user_id = ${userId})`] : []),
  ];
}

const NO_FILTERS: ActivityFilters = { q: "", committeeId: "", when: "", mine: false };

/** Visible activities that have not ended yet, soonest first. */
export function getActivities(userId: string | null, isMember: boolean, filters: ActivityFilters = NO_FILTERS) {
  const where = [sql`a.is_visible`, audience(isMember), sql`${endsAt()} > NOW()`, ...filterConditions(userId, filters)]
    .reduce((all, condition) => sql`${all} AND ${condition}`);
  return sql<Activity[]>`
    SELECT ${columns(userId)} FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE ${where} ORDER BY a.starts_at LIMIT 200
  `;
}

/** Visible activities that are over, most recent first. */
export function getPastActivities(userId: string | null, isMember: boolean, filters: ActivityFilters = NO_FILTERS, limit = 50) {
  const where = [sql`a.is_visible`, audience(isMember), sql`${endsAt()} <= NOW()`, ...filterConditions(userId, filters)]
    .reduce((all, condition) => sql`${all} AND ${condition}`);
  return sql<Activity[]>`
    SELECT ${columns(userId)} FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE ${where} ORDER BY a.starts_at DESC LIMIT ${limit}
  `;
}

/** Committees that organise activities, for the filter dropdown. */
export function getCommitteeOptions() {
  return sql<{ id: string; name: string }[]>`SELECT id, name FROM committees ORDER BY name`;
}

export interface UpcomingActivity {
  id: string;
  name: string;
  location: string;
  starts_at: Date;
  ends_at: Date | null;
  committee_name: string;
}

/** The next visible activities that have not ended yet, for the homepage and sidebar. */
export function getUpcomingActivities(limit: number, isMember: boolean) {
  return sql<UpcomingActivity[]>`
    SELECT a.id, a.name, a.location, a.starts_at, a.ends_at, COALESCE(c.name, 'Mastatine') AS committee_name
    FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE a.is_visible AND ${audience(isMember)} AND COALESCE(a.ends_at, a.starts_at + INTERVAL '3 hours') > NOW()
    ORDER BY a.starts_at LIMIT ${limit}
  `;
}

/** An upcoming activity with what a homepage card needs on top of the agenda fields. */
export interface UpcomingActivityCard extends UpcomingActivity, ParticipantCount {
  poster_url: string | null;
  members_only: boolean;
}

const cardCounts = () => sql`a.subscription_limit, (SELECT COUNT(*) FROM activity_subscriptions p WHERE p.activity_id = a.id)::int AS participants`;

/** The next visible activities that have not ended yet, with their posters, for the homepage cards. */
export function getUpcomingActivityCards(limit: number, isMember: boolean) {
  return sql<UpcomingActivityCard[]>`
    SELECT a.id, a.name, a.location, a.starts_at, a.ends_at, COALESCE(c.name, 'Mastatine') AS committee_name, a.poster_url, a.members_only, ${cardCounts()}
    FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE a.is_visible AND ${audience(isMember)} AND COALESCE(a.ends_at, a.starts_at + INTERVAL '3 hours') > NOW()
    ORDER BY a.starts_at LIMIT ${limit}
  `;
}

/** The soonest activity the user is going to that has not ended yet, or null. */
export async function getMyNextActivity(userId: string): Promise<UpcomingActivityCard | null> {
  const [row] = await sql<UpcomingActivityCard[]>`
    SELECT a.id, a.name, a.location, a.starts_at, a.ends_at, COALESCE(c.name, 'Mastatine') AS committee_name, a.poster_url, a.members_only, ${cardCounts()}
    FROM activity_subscriptions s
    JOIN activities a ON a.id = s.activity_id LEFT JOIN committees c ON c.id = a.committee_id
    WHERE s.user_id = ${userId} AND a.is_visible AND ${endsAt()} > NOW()
    ORDER BY a.starts_at LIMIT 1
  `;
  return row ?? null;
}

/** Which of the given activities the user is subscribed to. */
export async function getSubscribedIds(userId: string, activityIds: string[]): Promise<Set<string>> {
  if (activityIds.length === 0) return new Set();
  const rows = await sql<{ activity_id: string }[]>`
    SELECT activity_id FROM activity_subscriptions WHERE user_id = ${userId} AND activity_id IN ${sql(activityIds)}
  `;
  return new Set(rows.map((r) => r.activity_id));
}

/** Public activities from the last 60 days onwards, for the public calendar feed (never members-only ones). */
export function getCalendarActivities() {
  return sql<UpcomingActivity[]>`
    SELECT a.id, a.name, a.location, a.starts_at, a.ends_at, COALESCE(c.name, 'Mastatine') AS committee_name
    FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE a.is_visible AND NOT a.members_only AND a.starts_at > NOW() - INTERVAL '60 days'
    ORDER BY a.starts_at LIMIT 500
  `;
}

/** One activity in calendar form, or null when it does not exist, is hidden, or is members-only and the viewer is not a member. */
export async function getCalendarActivity(id: string, isMember: boolean): Promise<UpcomingActivity | null> {
  const [row] = await sql<UpcomingActivity[]>`
    SELECT a.id, a.name, a.location, a.starts_at, a.ends_at, COALESCE(c.name, 'Mastatine') AS committee_name
    FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE a.id = ${id} AND a.is_visible AND ${audience(isMember)}
  `;
  return row ?? null;
}

export async function getActivity(id: string, userId: string | null): Promise<Activity | null> {
  const [row] = await sql<Activity[]>`
    SELECT ${columns(userId)} FROM activities a LEFT JOIN committees c ON c.id = a.committee_id WHERE a.id = ${id}
  `;
  return row ?? null;
}

/** Activities organised by the committees the user sits on (all of them for admins), including hidden ones. */
export function getManagedActivities(user: Viewer) {
  const scope = user.role === "admin" ? sql`TRUE` : sql`a.committee_id IN (SELECT committee_id FROM committee_members WHERE user_id = ${user.id})`;
  return sql<Activity[]>`
    SELECT ${columns(user.id)} FROM activities a LEFT JOIN committees c ON c.id = a.committee_id
    WHERE ${scope} ORDER BY a.starts_at DESC LIMIT 200
  `;
}

export function getParticipants(activityId: string) {
  return sql<{ id: string; name: string; choices: SignupPick[]; price_cents: number | null }[]>`
    SELECT u.id, u.name, s.choices, s.price_cents FROM activity_subscriptions s JOIN "user" u ON u.id = s.user_id
    WHERE s.activity_id = ${activityId} ORDER BY s.created_at
  `;
}

export type SubscribeState = "open" | "full" | "not-yet" | "closed";

export function subscribeState(a: Activity, now = new Date()): SubscribeState {
  if (a.subscription_opens_at && now < a.subscription_opens_at) return "not-yet";
  if ((a.subscription_closes_at ?? a.starts_at) < now) return "closed";
  if (a.subscription_limit !== null && a.participants >= a.subscription_limit) return "full";
  return "open";
}

export function formatCost(cents: number | null): string {
  if (!cents) return "For free";
  return `€ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

/** What the "2 / ∞ going" count needs. */
export type ParticipantCount = Pick<Activity, "participants" | "subscription_limit">;

export const formatParticipants = (a: ParticipantCount): string => `${a.participants} / ${a.subscription_limit ?? "∞"}`;
