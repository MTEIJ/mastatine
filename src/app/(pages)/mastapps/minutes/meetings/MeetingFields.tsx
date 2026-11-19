import { Input, Label } from "@/components/ui/Field";
interface MeetingFieldsProps {
  defaults?: { title?: string; location?: string; starts_at?: string };
}

/** Title, time and place, shared by the new-meeting and edit-meeting forms. */
export default function MeetingFields({ defaults = {} }: MeetingFieldsProps) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required maxLength={120} defaultValue={defaults.title} />
        </div>
        <div>
          <Label htmlFor="location">Location</Label>
          <Input id="location" name="location" maxLength={200} defaultValue={defaults.location} />
        </div>
      </div>
      <div>
        <Label htmlFor="starts_at">Date and time</Label>
        <Input id="starts_at" name="starts_at" type="datetime-local" className="sm:max-w-xs" required defaultValue={defaults.starts_at} />
      </div>
    </>
  );
}
