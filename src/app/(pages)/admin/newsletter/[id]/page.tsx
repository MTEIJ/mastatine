import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";
import { notFound } from "next/navigation";
import { z } from "zod";
import sql from "@/lib/db";
import AutoRefresh from "@/components/admin/AutoRefresh";
import AudienceField from "@/components/admin/AudienceField";
import ConfirmButton from "@/components/admin/ConfirmButton";
import ActivitiesField from "@/components/admin/ActivitiesField";
import { newsletterEmail } from "@/lib/email-templates";
import { FORMAT_HINT } from "@/lib/email-style";
import { AUDIENCE_LABEL, parseAudience } from "@/lib/newsletter-audience";
import { issueStats, newsletterActivities } from "@/lib/newsletter";
import { deleteIssue, saveIssue, sendTest, startSending } from "../../actions";
import { requireAdmin } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Hint, Input, Label } from "@/components/ui/Field";
import { buttonClass, cardClass } from "@/components/ui/classes";

interface Issue {
  id: string;
  subject: string;
  body: string;
  status: "draft" | "sending" | "sent";
  audience: string;
  activities_count: number;
  sent_at: Date | null;
}

const NOTICES: Record<string, { text: string; tone: "ok" | "bad" }> = {
  saved: { text: "Draft saved.", tone: "ok" },
  "test-sent": { text: "Test email sent to your address.", tone: "ok" },
  "test-failed": { text: "The test email could not be sent. Check the SMTP settings.", tone: "bad" },
  sending: { text: "Sending started. This page updates as emails go out.", tone: "ok" },
  "no-recipients": { text: "There is nobody to send this to.", tone: "bad" },
};

export const instant = false;

export default async function IssuePage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ notice?: string }> }) {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const { id } = await props.params;
  const { notice } = await props.searchParams;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [issue] = await sql<Issue[]>`SELECT id, subject, body, status, audience, activities_count, sent_at FROM newsletters WHERE id = ${id}`;
  if (!issue) notFound();

  const stats = await issueStats(id);
  const message = notice ? NOTICES[notice] : undefined;
  const isDraft = issue.status === "draft";
  const audience = parseAudience(issue.audience);
  // The preview is the real email, so what is shown here is what arrives.
  const preview = newsletterEmail(issue.subject, issue.body, "https://example.invalid/unsubscribe", audience, await newsletterActivities(issue.activities_count, audience));

  return (
    <div className="grid gap-10 @3xl:grid-cols-2">
      {issue.status === "sending" && <AutoRefresh />}

      <div>
        <Link href="/admin/newsletter" className="text-sm font-medium text-accent-text hover:underline">&larr; Newsletter</Link>
        <h2 className="mt-3 text-2xl font-bold">{issue.subject}</h2>

        {message && (
          <p role="status" className={`mt-4 rounded-md px-4 py-3 text-sm ${message.tone === "ok" ? "bg-accent-soft text-accent-text" : "bg-danger/10 text-danger"}`}>
            {message.text}
          </p>
        )}

        <Card className="mt-6 p-5">
          <p className="text-sm text-muted">Status</p>
          <p className="mt-1 text-lg font-bold capitalize">{issue.status}</p>
          <p className="mt-1 text-sm text-muted">To: <strong className="text-ink">{AUDIENCE_LABEL[audience]}</strong></p>
          <dl className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div><dt className="text-muted">Delivered</dt><dd className="text-2xl font-bold tabular-nums">{stats.sent}</dd></div>
            <div><dt className="text-muted">Failed</dt><dd className="text-2xl font-bold tabular-nums">{stats.failed}</dd></div>
            <div><dt className="text-muted">Remaining</dt><dd className="text-2xl font-bold tabular-nums">{isDraft ? stats.recipients : stats.pending}</dd></div>
          </dl>
        </Card>

        {isDraft ? (
          <form action={saveIssue} className={cardClass("mt-6 space-y-5 p-6")}>
            <input type="hidden" name="id" value={issue.id} />
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" defaultValue={issue.subject} required maxLength={150} />
            </div>
            <div>
              <Label htmlFor="body">Message</Label>
              <MarkdownEditor id="body" name="body" heightClass="min-h-64" defaultValue={issue.body} required maxLength={20000} />
              <Hint>{FORMAT_HINT}</Hint>
            </div>
            <ActivitiesField defaultValue={issue.activities_count} />
            <AudienceField defaultValue={audience} />
            <Button type="submit" variant="secondary">Save draft</Button>
          </form>
        ) : (
          <p className="mt-6 text-sm text-muted">This issue is {issue.status === "sent" ? "sent" : "being sent"} and can no longer be edited.</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <form action={sendTest}>
            <input type="hidden" name="id" value={issue.id} />
            <Button type="submit" variant="secondary">Send test to me</Button>
          </form>
          {issue.status !== "sent" && (
            <form action={startSending}>
              <input type="hidden" name="id" value={issue.id} />
              <ConfirmButton
                className={buttonClass({ variant: "primary" })}
                message={`Send “${issue.subject}” to ${stats.recipients} ${AUDIENCE_LABEL[audience].toLowerCase()} (${stats.recipients === 1 ? "1 person" : `${stats.recipients} people`})? This cannot be undone.`}
              >
                {isDraft ? `Send to ${stats.recipients} ${stats.recipients === 1 ? "person" : "people"}` : "Resume sending"}
              </ConfirmButton>
            </form>
          )}
          {isDraft && (
            <form action={deleteIssue}>
              <input type="hidden" name="id" value={issue.id} />
              <ConfirmButton message="Delete this draft?" className={buttonClass({ variant: "danger" })}>Delete draft</ConfirmButton>
            </form>
          )}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-muted">Preview</p>
        {/* The sandbox has no scripts or navigation: the email is shown exactly as built, but cannot act. */}
        <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="mt-3 h-[44rem] w-full rounded-lg border border-line bg-white" />
      </div>
    </div>
  );
}
