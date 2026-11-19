"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { BOARD_CALL } from "@/content/site";
import { parseBoardApplication, roleTitle } from "@/lib/board-application";
import sql from "@/lib/db";
import { boardApplicationEmail } from "@/lib/email-templates";
import { sendMail } from "@/lib/mailer";
import { storeFormImage } from "@/lib/poster";
import { createRateLimiter } from "@/lib/rate-limit";
import { requireNamedSession } from "@/lib/session";

export interface BoardApplicationState {
  error?: string;
  sent?: boolean;
}

// Each send can store a photo, so a person gets a handful of tries per hour.
const applyLimiter = createRateLimiter(6, 60 * 60 * 1000);

/** Saves (or replaces) the signed-in person's board application and tells the admins. */
export async function applyForBoard(_prev: BoardApplicationState, formData: FormData): Promise<BoardApplicationState> {
  const { user } = await requireNamedSession("/board#apply");
  if (!BOARD_CALL.open) return { error: "Applications are closed." };

  const parsed = parseBoardApplication(formData);
  if (!parsed.ok) return { error: parsed.error };
  if (!applyLimiter.allow(user.id)) return { error: "That is a lot of applications. Try again in an hour." };

  const [existing] = await sql<{ mast_photo: string }[]>`SELECT mast_photo FROM board_applications WHERE user_id = ${user.id}`;
  const photo = formData.get("mast_photo");
  const hasNewPhoto = photo instanceof File && photo.size > 0;
  if (!hasNewPhoto && !existing) return { error: "No mast, no board. Upload a photo of your favourite mast." };

  let mastPhoto = existing?.mast_photo ?? "";
  if (hasNewPhoto) {
    const stored = await storeFormImage(photo, "The mast photo");
    if ("error" in stored) return { error: stored.error };
    mastPhoto = stored.url;
  }

  const d = parsed.data;
  await sql`
    INSERT INTO board_applications (user_id, first_choice, second_choice, motivation, ambitions, study, hours_per_week, mast_photo,
      mast_location, superpower)
    VALUES (${user.id}, ${d.first_choice}, ${d.second_choice}, ${d.motivation}, ${d.ambitions}, ${d.study}, ${d.hours_per_week}, ${mastPhoto},
      ${d.mast_location}, ${d.superpower})
    ON CONFLICT (user_id) DO UPDATE SET first_choice = EXCLUDED.first_choice, second_choice = EXCLUDED.second_choice,
      motivation = EXCLUDED.motivation, ambitions = EXCLUDED.ambitions, study = EXCLUDED.study, hours_per_week = EXCLUDED.hours_per_week,
      mast_photo = EXCLUDED.mast_photo, mast_location = EXCLUDED.mast_location,
      superpower = EXCLUDED.superpower, updated_at = NOW()
  `;

  const message = boardApplicationEmail({
    name: user.name,
    email: user.email,
    firstChoice: roleTitle(d.first_choice),
    secondChoice: d.second_choice ? roleTitle(d.second_choice) : null,
    updated: Boolean(existing),
  });
  after(() => notifyAdmins(message));
  revalidatePath("/board");
  revalidatePath("/admin/board");
  return { sent: true };
}

async function notifyAdmins(message: ReturnType<typeof boardApplicationEmail>): Promise<void> {
  const admins = await sql<{ email: string }[]>`SELECT email FROM "user" WHERE role = 'admin' AND NOT banned`;
  // One mail per admin so nobody sees the other addresses.
  const results = await Promise.allSettled(admins.map((admin) => sendMail({ to: admin.email, ...message })));
  for (const result of results) {
    if (result.status === "rejected") console.error("Failed to send the board application email:", (result.reason as Error).message);
  }
}

/** Lets an applicant take their application back. */
export async function withdrawBoardApplication(): Promise<void> {
  const { user } = await requireNamedSession("/board#apply");
  await sql`DELETE FROM board_applications WHERE user_id = ${user.id}`;
  revalidatePath("/board");
  revalidatePath("/admin/board");
}
