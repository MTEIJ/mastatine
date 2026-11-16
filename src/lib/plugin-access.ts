import sql from "@/lib/db";
import { isCommitteeMember } from "@/lib/committees";
import { getSession } from "@/lib/session";
import type { PluginViewer } from "@/plugins/types";

/** The viewer as plugins see it: is there a session, and does it belong to a committee member of the activity (or an admin)? */
export async function getPluginViewer(activityId: string): Promise<PluginViewer> {
  const session = await getSession();
  if (!session) return { userId: null, isManager: false };
  const [activity] = await sql<{ committee_id: string }[]>`SELECT committee_id FROM activities WHERE id = ${activityId}`;
  const isManager = !!activity && (await isCommitteeMember(session.user, activity.committee_id));
  return { userId: session.user.id, isManager };
}
