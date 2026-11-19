import type { Metadata } from "next";
import { redirect } from "next/navigation";
import sql from "@/lib/db";
import { getNewsletterStatus } from "@/lib/newsletter";
import { safeNextPath } from "@/lib/safe-redirect";
import { requireUser } from "@/lib/session";
import { answerNewsletterPrompt } from "./actions";
import { Button } from "@/components/ui/Button";
import { cardClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Welcome", robots: { index: false } };

const PROMISES = ["About four emails a year, never more than one a month.", "One-click unsubscribe in every email.", "You can change your mind any time on your account page."];

/**
 * Shown right after signing in, but only until the newsletter question has been answered (yes, no, or "not now").
 * Anyone who already has a subscription record has answered before and passes straight through.
 */
export const instant = false;

export default async function WelcomePage(props: { searchParams: Promise<{ next?: string }> }) {
  const { user } = await requireUser({ allowUnnamed: true });
  const next = safeNextPath((await props.searchParams).next, "/account");

  const [row] = await sql<{ newsletter_prompted_at: Date | null }[]>`SELECT newsletter_prompted_at FROM "user" WHERE id = ${user.id}`;
  const answered = !!row?.newsletter_prompted_at || (await getNewsletterStatus(user.email)) !== "none";
  if (answered) {
    if (!row?.newsletter_prompted_at) await sql`UPDATE "user" SET newsletter_prompted_at = NOW() WHERE id = ${user.id}`;
    redirect(next);
  }

  return (
    <div className="container-prose flex justify-center pb-10 pt-20 sm:py-24">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-extrabold sm:text-5xl">You are signed in</h1>
        <p className="mt-3 text-muted">One question before you go: would you like the newsletter? The best masts, the news and what is coming up.</p>
        <form action={answerNewsletterPrompt} className={cardClass("mt-8 space-y-3 p-6 sm:p-8")}>
          <input type="hidden" name="next" value={next} />
          <Button type="submit" name="answer" value="yes" variant="primary" className="w-full py-3">Yes, send me the newsletter</Button>
          <Button type="submit" name="answer" value="no" variant="secondary" className="w-full py-3">No thanks</Button>
          <Button type="submit" name="answer" value="later" variant="ghost" className="w-full">Not now</Button>
        </form>
        <ul className="mt-6 space-y-2 text-sm text-muted">
          {PROMISES.map((promise) => (
            <li key={promise} className="flex gap-3">
              <span className="mt-0.5 text-accent-text" aria-hidden>✓</span>
              {promise}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
