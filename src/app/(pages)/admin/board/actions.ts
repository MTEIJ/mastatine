"use server";

import { revalidatePath } from "next/cache";
import sql from "@/lib/db";
import { requireAdmin } from "@/lib/session";

/** Deletes every board application, once the board is chosen. The mast photos are cleaned up by the nightly purge. */
export async function clearBoardApplications(formData: FormData): Promise<void> {
  await requireAdmin();
  if (formData.get("confirm") !== "on") return;
  await sql`DELETE FROM board_applications`;
  revalidatePath("/admin/board");
  revalidatePath("/board");
}
