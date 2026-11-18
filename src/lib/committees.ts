import sql from "@/lib/db";

export interface Committee {
  id: string;
  name: string;
}

export interface Person {
  id: string;
  name: string;
}

type Viewer = { id: string; role?: string | null };

/** Committees a user belongs to; admins count as members of every committee. */
export function getCommitteesFor(user: Viewer): Promise<Committee[]> {
  if (user.role === "admin") return sql<Committee[]>`SELECT id, name FROM committees ORDER BY name`;
  return sql<Committee[]>`
    SELECT c.id, c.name FROM committees c JOIN committee_members m ON m.committee_id = c.id
    WHERE m.user_id = ${user.id} ORDER BY c.name
  `;
}

export async function isCommitteeMember(user: Viewer, committeeId: string | null): Promise<boolean> {
  if (user.role === "admin") return true;
  if (!committeeId) return false;
  const [row] = await sql`SELECT 1 FROM committee_members WHERE user_id = ${user.id} AND committee_id = ${committeeId}`;
  return !!row;
}

/** Members of one committee, for handing out action points. */
export function getCommitteePeople(committeeId: string) {
  return sql<Person[]>`
    SELECT u.id, u.name FROM "user" u JOIN committee_members m ON m.user_id = u.id
    WHERE m.committee_id = ${committeeId} ORDER BY u.name
  `;
}

export interface PublicCommittee {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  banner_url: string | null;
  /** Display names only (never email addresses), chairs first. */
  members: { name: string; is_chair: boolean }[];
}

type CommitteeRow = Omit<PublicCommittee, "members">;

/** Names only, chairs first. Banned accounts are left out. */
async function loadMembers(committeeId?: string) {
  return sql<{ committee_id: string; name: string; is_chair: boolean }[]>`
    SELECT m.committee_id, COALESCE(NULLIF(trim(u.name), ''), 'Member') AS name, m.is_chair
    FROM committee_members m JOIN "user" u ON u.id = m.user_id
    WHERE NOT u.banned ${committeeId ? sql`AND m.committee_id = ${committeeId}` : sql``}
    ORDER BY m.is_chair DESC, lower(u.name)
  `;
}

const withMembers = (c: CommitteeRow, members: { committee_id: string; name: string; is_chair: boolean }[]): PublicCommittee => ({
  ...c,
  members: members.filter((m) => m.committee_id === c.id).map(({ name, is_chair }) => ({ name, is_chair })),
});

/** Every committee not hidden by an admin, with its members, for the public committees overview. */
export async function getPublicCommittees(): Promise<PublicCommittee[]> {
  const [committees, members] = await Promise.all([
    sql<CommitteeRow[]>`SELECT id, slug, name, description, banner_url FROM committees WHERE is_public ORDER BY name`,
    loadMembers(),
  ]);
  return committees.map((c) => withMembers(c, members));
}

/** One committee for its own page, or null when the slug is unknown or the committee is hidden. */
export async function getPublicCommittee(slug: string): Promise<PublicCommittee | null> {
  const [committee] = await sql<CommitteeRow[]>`SELECT id, slug, name, description, banner_url FROM committees WHERE slug = ${slug} AND is_public`;
  if (!committee) return null;
  return withMembers(committee, await loadMembers(committee.id));
}

export type JoinStatus = "member" | "pending" | "none";

/** Where a signed-in person stands with a committee: already in, waiting for an answer, or neither. */
export async function getJoinStatus(userId: string, committeeId: string): Promise<JoinStatus> {
  const [row] = await sql<{ status: JoinStatus }[]>`
    SELECT CASE
      WHEN EXISTS (SELECT 1 FROM committee_members WHERE committee_id = ${committeeId} AND user_id = ${userId}) THEN 'member'
      WHEN EXISTS (SELECT 1 FROM committee_join_requests WHERE committee_id = ${committeeId} AND user_id = ${userId} AND status = 'pending') THEN 'pending'
      ELSE 'none' END AS status
  `;
  return row.status;
}

export interface PendingJoinRequest {
  id: string;
  committee_id: string;
  name: string;
  email: string;
  message: string;
  created_at: Date;
}

/** Open join requests, oldest first, for the admin. */
export function getPendingJoinRequests() {
  return sql<PendingJoinRequest[]>`
    SELECT r.id, r.committee_id, u.name, u.email, r.message, r.created_at
    FROM committee_join_requests r JOIN "user" u ON u.id = r.user_id
    WHERE r.status = 'pending' ORDER BY r.created_at
  `;
}

/** A URL-friendly slug from a committee name ("The Beacon" becomes "the-beacon"). */
export function slugifyCommittee(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "committee"
  );
}

/** What other people see for a person. Never falls back to an email address. */
export const displayName = (u: { name: string | null }): string => u.name?.trim() || "Unnamed member";
