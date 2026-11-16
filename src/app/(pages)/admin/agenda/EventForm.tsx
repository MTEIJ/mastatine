import { toLocalInput } from "@/lib/datetime";
import type { CalendarEvent } from "@/lib/calendar-events";

interface EventFormProps {
  action: (formData: FormData) => Promise<void>;
  event?: CalendarEvent;
  submitLabel: string;
}

/** Shared by "New agenda item" and "Edit agenda item". */
export default function EventForm({ action, event, submitLabel }: EventFormProps) {
  return (
    <form action={action} className="card mt-4 space-y-4 p-4">
      {event && <input type="hidden" name="id" value={event.id} />}
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" className="input" required maxLength={120} defaultValue={event?.title} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="starts_at">Starts</label>
          <input id="starts_at" name="starts_at" type="datetime-local" className="input" required defaultValue={toLocalInput(event?.starts_at)} />
        </div>
        <div>
          <label className="label" htmlFor="ends_at">Ends (optional)</label>
          <input id="ends_at" name="ends_at" type="datetime-local" className="input" defaultValue={toLocalInput(event?.ends_at)} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="location">Location (optional)</label>
        <input id="location" name="location" className="input" maxLength={200} defaultValue={event?.location} />
      </div>
      <div>
        <label className="label" htmlFor="description">Notes (optional)</label>
        <textarea id="description" name="description" className="input min-h-28" maxLength={2000} defaultValue={event?.description} />
      </div>
      <label className="choice-row">
        <input type="checkbox" name="is_visible" defaultChecked={event?.is_visible ?? true} className="mt-0" />
        <span className="font-bold">Show in the calendar feed</span>
      </label>
      <button type="submit" className="btn btn-primary">{submitLabel}</button>
    </form>
  );
}
