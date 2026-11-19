import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";
import { createIssue } from "../../actions";
import AudienceField from "@/components/admin/AudienceField";
import ActivitiesField from "@/components/admin/ActivitiesField";
import { FORMAT_HINT } from "@/lib/email-style";
import { requireAdmin } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Hint, Input, Label } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

export const instant = false;

export default async function NewIssuePage() {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  return (
    <div className="max-w-2xl">
      <Link href="/admin/newsletter" className="text-sm font-medium text-accent-text hover:underline">&larr; Newsletter</Link>
      <h2 className="mt-3 text-2xl font-bold">New issue</h2>
      <form action={createIssue} className={cardClass("mt-6 space-y-5 p-6")}>
        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" required maxLength={150} />
        </div>
        <div>
          <Label htmlFor="body">Message</Label>
          <MarkdownEditor id="body" name="body" heightClass="min-h-72" required maxLength={20000} />
          <Hint>{FORMAT_HINT} Blank lines start a new paragraph and web addresses become links. The unsubscribe link and the footer notice are added automatically.</Hint>
        </div>
        <ActivitiesField />
        <AudienceField />
        <Button type="submit" variant="primary">Save as draft</Button>
      </form>
    </div>
  );
}
