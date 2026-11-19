import { Hint, Label, Select } from "@/components/ui/Field";
const CHOICES = [0, 1, 2, 3, 4, 5, 6, 8];

/** How many upcoming activities, with their posters, a newsletter issue shows under its message. */
export default function ActivitiesField({ defaultValue = 0 }: { defaultValue?: number }) {
  return (
    <div>
      <Label htmlFor="activities_count">Upcoming activities</Label>
      <Select id="activities_count" name="activities_count" defaultValue={defaultValue}>
        {CHOICES.map((n) => (
          <option key={n} value={n}>{n === 0 ? "Don’t show activities" : `The next ${n} ${n === 1 ? "activity" : "activities"}`}</option>
        ))}
      </Select>
      <Hint>Added under your message as a “Coming up” block with the posters. The list is picked when the issue is sent, and members-only activities only appear in issues for members.</Hint>
    </div>
  );
}
