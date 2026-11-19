import { AUDIENCES, AUDIENCE_HINT, AUDIENCE_LABEL, type Audience } from "@/lib/newsletter-audience";
import { Hint } from "@/components/ui/Field";
import { labelClass } from "@/components/ui/classes";

/** "Send to" choice for a newsletter issue: subscribers, members only, or everyone. */
export default function AudienceField({ defaultValue = "subscribers" }: { defaultValue?: Audience }) {
  return (
    <fieldset>
      <legend className={labelClass()}>Send to</legend>
      <div className="space-y-2">
        {AUDIENCES.map((audience) => (
          <label key={audience} className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
            <input type="radio" name="audience" value={audience} defaultChecked={audience === defaultValue} className="mt-1" />
            <span>
              <span className="block font-bold">{AUDIENCE_LABEL[audience]}</span>
              <span className="block text-sm text-muted">{AUDIENCE_HINT[audience]}</span>
            </span>
          </label>
        ))}
      </div>
      <Hint>Anyone who unsubscribed is never emailed, whichever you choose. Reaching members or everyone adds them to the newsletter list, and every email has an unsubscribe link.</Hint>
    </fieldset>
  );
}
