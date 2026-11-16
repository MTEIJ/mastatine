"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import sql from "@/lib/db";
import { requireNamedSession } from "@/lib/session";

const requestSchema = z.object({
  committeeId: z.string().uuid(),
  message: z.string().trim().max(1000),
});

/** Asks to join a committee. Asking again while a request is open, or when already a member, changes nothing. */
export async function requestToJoinCommittee(formData: FormData): Promise<void> {
  const data = requestSchema.parse(Object.fromEntries(formData));
  const [committee] = await sql<{ slug: string }[]>`SELECT slug FROM committees WHERE id = ${data.committeeId} AND is_public`;
  if (!committee) return;

  const { user } = await requireNamedSession(`/committees/${committee.slug}`);
  await sql`
    INSERT INTO committee_join_requests (committee_id, user_id, message)
    SELECT ${data.committeeId}, ${user.id}, ${data.message}
    WHERE NOT EXISTS (SELECT 1 FROM committee_members WHERE committee_id = ${data.committeeId} AND user_id = ${user.id})
    ON CONFLICT DO NOTHING
  `;
  revalidatePath(`/committees/${committee.slug}`);
  revalidatePath("/admin/committees");
}
