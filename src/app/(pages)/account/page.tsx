import type { Metadata } from "next";
import Link from "next/link";
import AccountPanel from "@/components/AccountPanel";
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
  const initial = (user.name?.trim().charAt(0) || user.email.charAt(0)).toUpperCase();

  return (
    <div className="container-prose account pb-10 pt-6 sm:py-16">
      <header className="account-head">
        <span className="avatar" aria-hidden>{initial}</span>
        <div className="account-head__who">
          <h1 className="account-head__name">{user.name || "Your account"}</h1>
          <p className="account-head__email">{user.email}</p>
        </div>
        {/* In the installed app, signing out sits at the bottom, away from the everyday things. */}
        <div className="only-web"><SignOutButton /></div>
      </header>
      {emailResult === "changed" && !linkError && <p role="status" className="mt-3 rounded-md bg-success/10 px-4 py-3 text-sm text-success">Your email address is now {user.email}. Use it to sign in from now on.</p>}
      {linkError && <p role="alert" className="mt-3 rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">That confirmation link did not work. It may have expired or been used already; ask for a new one below.</p>}

      {!membership.isMember && (
        <section id="membership" aria-labelledby="membership-title" className={cardClass("mt-6 p-4")}>
          <h2 id="membership-title" className="text-lg font-extrabold">Become a member</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Members get access to the Quotes app and to members-only activities. It is free; an admin approves each request.</p>
          <MembershipRequest membership={membership} next="/account" />
        </section>
      )}

      {/* The app has the Apps tab for this. */}
      <Link href="/mastapps" className={cardClass("only-web mt-6 flex items-center justify-between p-4 font-extrabold text-ink hover:border-accent hover:text-accent-text")}>
        <span>Open MastApps</span>
        <span aria-hidden>&rarr;</span>
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

      <div className="mt-6">
        <AccountPanel initialName={user.name ?? ""} email={user.email} />
      </div>

      <div className="only-app account-signout"><SignOutButton /></div>
    </div>
  );
}
