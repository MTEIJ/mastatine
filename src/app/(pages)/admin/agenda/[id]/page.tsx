import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { getEvent } from "@/lib/calendar-events";
import { requireAdmin } from "@/lib/session";
import { deleteEvent, saveEvent } from "../actions";
import EventForm from "../EventForm";
import { buttonClass } from "@/components/ui/classes";

export const instant = false;

export default async function EditEventPage(props: { params: Promise<{ id: string }> }) {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const { id } = await props.params;
  if (!z.uuid().safeParse(id).success) notFound();
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/agenda" className="text-sm font-medium text-accent-text hover:underline">&larr; Agenda</Link>
      <h2 className="mt-3 text-2xl font-bold">Edit agenda item</h2>
      <EventForm action={saveEvent} event={event} submitLabel="Save changes" />
      <form action={deleteEvent} className="mt-4">
        <input type="hidden" name="id" value={event.id} />
        <ConfirmButton message={`Delete “${event.title}”? This cannot be undone.`} className={buttonClass({ variant: "danger", size: "sm" })}>Delete item</ConfirmButton>
      </form>
    </div>
  );
}
