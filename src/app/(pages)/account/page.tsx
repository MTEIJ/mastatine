import type { Metadata } from "next";
import Link from "next/link";
import { AccountDataRows, ProfileCard } from "@/components/AccountPanel";
import { InstallCard, NotificationsRow } from "@/components/AppSettings";
import MembershipRequest from "@/components/MembershipRequest";
import SignOutButton from "@/components/SignOutButton";
import { getMembership } from "@/lib/membership";
import { getNewsletterStatus, type NewsletterStatus } from "@/lib/newsletter";
import { vapidPublicKey } from "@/lib/push";
import { requireUser } from "@/lib/session";
import { setNewsletter } from "./actions";
import { cardClass } from "@/components/ui/classes";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

const STATUS_TEXT: Record<NewsletterStatus, string> = {
  confirmed: "About four emails a year.",
  pending: "Not confirmed yet. Switching on here confirms it.",
  unsubscribed: "Off.",
  none: "Off.",
};

export const instant = false;

export default async function AccountPage(props: { searchParams: Promise<{ email?: string; error?: string }> }) {
  const { user } = await requireUser();
  const { email: emailResult, error: linkError } = await props.searchParams;
  const [newsletter, membership] = await Promise.all([getNewsletterStatus(user.email), getMembership()]);
  const pushKey = vapidPublicKey();

  return (
    <div className="container-prose account pb-10 pt-4 sm:py-16">
      <ProfileCard initialName={user.name ?? ""} email={user.email} />
      {emailResult === "changed" && !linkError && <p role="status" className="mt-3 rounded-md bg-success/10 px-4 py-3 text-sm text-success">Your email address is now {user.email}. Use it to sign in from now on.</p>}
      {linkError && <p role="alert" className="mt-3 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">That confirmation link did not work. It may have expired or been used already; ask for a new one below.</p>}

      {!membership.isMember && (
        <section id="membership" aria-labelledby="membership-title" className={cardClass("mt-4 p-4")}>
          <h2 id="membership-title" className="text-lg font-extrabold">Become a member</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Members get access to the Quotes app and to members-only activities. It is free; an admin approves each request.</p>
          <MembershipRequest membership={membership} next="/account" />
        </section>
      )}

      {/* The app has the Apps tab for this. */}
      <Link href="/mastapps" className={cardClass("setting-row setting-row--link only-web mt-4")}>
        <span className="setting-row__body"><span className="setting-row__title">Open MastApps</span></span>
        <span aria-hidden className="setting-row__chevron">&rsaquo;</span>
      </Link>

      <InstallCard />

      <section aria-label="Settings" className={cardClass("setting-list mt-4")}>
        {pushKey && <NotificationsRow publicKey={pushKey} />}
        <form action={setNewsletter} className="setting-row">
          <input type="hidden" name="subscribe" value={newsletter === "confirmed" ? "no" : "yes"} />
          <div className="setting-row__body">
            <h2 id="newsletter-title" className="setting-row__title">Newsletter</h2>
            <p className="setting-row__text">{STATUS_TEXT[newsletter]}</p>
          </div>
          <button type="submit" role="switch" aria-checked={newsletter === "confirmed"} aria-labelledby="newsletter-title" className="switch" />
        </form>
      </section>

      <section aria-label="Your data" className={cardClass("setting-list mt-4")}>
        <AccountDataRows />
      </section>

      <div className="account-signout"><SignOutButton /></div>
    </div>
  );
}
