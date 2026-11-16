import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { createEvent } from "../actions";
import EventForm from "../EventForm";

export const instant = false;

export default async function NewEventPage() {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <Link href="/admin/agenda" className="text-sm font-medium text-accent-text hover:underline">&larr; Agenda</Link>
      <h2 className="mt-3 text-2xl font-bold">New agenda item</h2>
      <EventForm action={createEvent} submitLabel="Add to agenda" />
    </div>
  );
}
