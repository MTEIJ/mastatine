import MarkdownEditor from "@/components/MarkdownEditor";
import { toLocalInput } from "@/lib/datetime";
import type { CalendarEvent } from "@/lib/calendar-events";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

interface EventFormProps {
  action: (formData: FormData) => Promise<void>;
  event?: CalendarEvent;
  submitLabel: string;
}

/** Shared by "New agenda item" and "Edit agenda item". */
export default function EventForm({ action, event, submitLabel }: EventFormProps) {
  return (
    <form action={action} className={cardClass("mt-4 space-y-4 p-4")}>
      {event && <input type="hidden" name="id" value={event.id} />}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required maxLength={120} defaultValue={event?.title} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="starts_at">Starts</Label>
          <Input id="starts_at" name="starts_at" type="datetime-local" required defaultValue={toLocalInput(event?.starts_at)} />
        </div>
        <div>
          <Label htmlFor="ends_at">Ends (optional)</Label>
          <Input id="ends_at" name="ends_at" type="datetime-local" defaultValue={toLocalInput(event?.ends_at)} />
        </div>
      </div>
      <div>
        <Label htmlFor="location">Location (optional)</Label>
        <Input id="location" name="location" maxLength={200} defaultValue={event?.location} />
      </div>
      <div>
        <Label htmlFor="description">Notes (optional)</Label>
        <MarkdownEditor id="description" name="description" maxLength={2000} defaultValue={event?.description} />
      </div>
      <label className="choice-row">
        <input type="checkbox" name="is_visible" defaultChecked={event?.is_visible ?? true} className="mt-0" />
        <span className="font-bold">Show in the calendar feed</span>
      </label>
      <Button type="submit" variant="primary">{submitLabel}</Button>
    </form>
  );
}
