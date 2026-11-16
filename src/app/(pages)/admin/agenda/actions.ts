"use server";

import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import sql from "@/lib/db";
import { fromLocalInput } from "@/lib/datetime";
import { requireAdmin } from "@/lib/session";

const id = z.uuid();

const eventSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000),
    location: z.string().trim().max(200),
    starts_at: z.string().transform((v) => fromLocalInput(v)),
    ends_at: z.string().transform((v) => (v ? fromLocalInput(v) : null)),
    is_visible: z.string().optional().transform((v) => v === "on"),
  })
  .refine((d) => d.starts_at !== null, { path: ["starts_at"] })
  .refine((d) => !d.ends_at || (d.starts_at !== null && d.ends_at >= d.starts_at), { path: ["ends_at"] });

function parse(formData: FormData) {
  const result = eventSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) redirect("/admin/agenda?notice=invalid");
  return { ...result.data, starts_at: result.data.starts_at as Date };
}

// The calendar feed is built per request; the sidebar agenda is cached under the "activities" tag.
function refresh() {
  updateTag("activities");
  revalidatePath("/", "layout");
}

export async function createEvent(formData: FormData) {
  const session = await requireAdmin();
  const d = parse(formData);
  await sql`
    INSERT INTO calendar_events (title, description, location, starts_at, ends_at, is_visible, created_by)
    VALUES (${d.title}, ${d.description}, ${d.location}, ${d.starts_at}, ${d.ends_at}, ${d.is_visible}, ${session.user.id})
  `;
  refresh();
  redirect("/admin/agenda?notice=created");
}

export async function saveEvent(formData: FormData) {
  await requireAdmin();
  const eventId = id.parse(formData.get("id"));
  const d = parse(formData);
  await sql`
    UPDATE calendar_events SET title = ${d.title}, description = ${d.description}, location = ${d.location},
      starts_at = ${d.starts_at}, ends_at = ${d.ends_at}, is_visible = ${d.is_visible}
    WHERE id = ${eventId}
  `;
  refresh();
  redirect("/admin/agenda?notice=saved");
}

export async function deleteEvent(formData: FormData) {
  await requireAdmin();
  await sql`DELETE FROM calendar_events WHERE id = ${id.parse(formData.get("id"))}`;
  refresh();
  redirect("/admin/agenda?notice=deleted");
}
