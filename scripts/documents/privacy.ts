import type { LegalIdentity } from "@/lib/legal";
import type { DocSpec } from "./render";

/** The privacy statement as a PDF. Keep it in line with the /privacy page; the controller details come from the environment. */
export function privacyStatement(legal: LegalIdentity): DocSpec {
  const controller = [legal.name ?? "M.A. Mastatine", legal.address, legal.kvk ? `KvK ${legal.kvk}` : null].filter(Boolean).join(", ");
  const reach = legal.email ? `Reach us at ${legal.email} or through the contact page of the website.` : "Reach us through the contact page of the website.";

  return {
    category: "privacy",
    title: "Privacy statement",
    description: "What M.A. Mastatine stores about you, why, how long, and how to have it removed.",
    version: "v1.0",
    date: "2026-11-16",
    visibility: "public",
    status: "In force. The latest version is always on the website.",
    sections: [
      {
        heading: "Who is responsible",
        blocks: [
          `${controller} runs this site and decides what is done with your data (the “controller” under the GDPR/AVG). ${reach}`,
          "We collect as little as possible. This statement lists everything we hold, and how to get it deleted.",
        ],
      },
      {
        heading: "What we store",
        blocks: [
          [
            "Mast votes. A random identifier generated in your browser (local storage, key mastatine_voter_id) and the masts you voted on. Signed out, it is not linked to your name or email and stays in your browser until you clear your site data. When you are signed in, your votes are saved to your account instead (and votes you cast earlier in that browser are moved onto it), so they follow you to other devices. They are deleted with your account and included in your data export.",
            "Submitted masts. The name you typed, the mast’s title, description and height, and the photo. These are shown publicly. Photo metadata, including GPS location, is removed on upload. Only submit photos you took or may share, and avoid recognisable people.",
            "Quotes. The quote, the name of the person who said it, the date, and (if you were signed in) which account added it. Quotes are only visible to members. If you were quoted and want it removed or changed, tell us and we will do so.",
            "Quote ratings. Your score and your account.",
            "Accounts. Your email address, an optional display name, and session records (created when you open a sign-in link; each includes your IP address and browser type, for security). Whether you asked to become a member, when, and whether an administrator approved it. If an administrator adds you to a committee, your display name (never your email address) is shown on the public committees page.",
            "Activities. Which activities you signed up for, and the choices you made when signing up.",
            "Newsletter. Your email address, when you asked for it and when you confirmed it. If you unsubscribe we keep the address marked as unsubscribed so we never email you again by accident; ask us if you want that removed too.",
            "Server logs and rate limiting. Your IP address is used briefly to stop abuse, such as repeated votes or sign-in requests.",
          ],
        ],
      },
      {
        heading: "Cookies and local storage",
        blocks: [
          "We only use storage that the site needs to work. We do not use advertising or analytics cookies and there are no third-party trackers, so there is no cookie banner. Fonts are served from this site, not from Google.",
          [
            "Session cookie. Set when you sign in, to keep you signed in. Removed when you sign out or it expires.",
            "mastatine_voter_id (local storage). Same purpose for votes on masts. Stays until you clear it.",
            "mastatine_dismissed_announcement (local storage). Remembers that you closed the news banner, so it does not return until there is new news. Stays until you clear it.",
          ],
        ],
      },
      {
        heading: "Why, and on what basis",
        blocks: [
          [
            "Votes, ratings, submitted masts and quotes: to run the gallery and community (legitimate interest).",
            "Accounts and activity sign-ups: to let you sign in and take part (necessary to provide the service you asked for).",
            "Membership administration: to run the association and let members vote (legitimate interest, and our statutes).",
            "Newsletter: only with your consent, either confirmed by a link we email you, or given by answering yes to the one-time question shown after your first sign-in (or with the switch on your account page). Withdraw it any time with the unsubscribe link in every email.",
            "Technical logs and rate limiting: to keep the site secure and stop abuse (legitimate interest).",
          ],
        ],
      },
      {
        heading: "Who handles it",
        blocks: [
          "The site runs on a server we control. Emails (sign-in links, newsletter) are delivered through our mail provider, Purelymail, which is based in the United States. That means your email address and the emails themselves can be processed outside the EU/EEA. We do not sell your data or share it with anyone else. Members of the board and of committees only see the data they need for their task.",
        ],
      },
      {
        heading: "How long we keep it",
        blocks: [
          [
            "Accounts, until you delete your account (on the account page of the website) or ask us to.",
            "Sign-in sessions (with IP address and browser type) and sign-in links: removed automatically once they expire, at most 30 days after you sign in.",
            "Newsletter sign-ups you never confirmed: removed automatically after 7 days.",
            "Submitted masts, quotes and votes, until removed by you, by us on request, or by an administrator.",
            "Newsletter addresses, until you ask us to remove them. Unsubscribed addresses are kept only to avoid emailing you again.",
            "Memberships that have been inactive for five years lapse. The account stays until you delete it.",
          ],
        ],
      },
      {
        heading: "Your rights",
        blocks: [
          "You can ask us to show what we hold about you, correct it, delete it, restrict its use or hand it over in a usable format. You can object to processing based on legitimate interest, and withdraw consent (for example for the newsletter) at any time. Signed-in users can download their data and delete their account from the account page. For anything else, use the contact page; we answer within one month.",
          "If you are unhappy with how we handle your data, you can complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens).",
        ],
      },
      {
        heading: "Data breaches and changes",
        blocks: [
          "If personal data is lost or exposed in a way that creates a risk for you, we report it to the Dutch Data Protection Authority within 72 hours and, where the risk is high, tell you directly. If we change this statement, the new version is published on the website and the date and version above are updated. Earlier versions are available on request.",
          "M.A. Mastatine is an independent student initiative and is not affiliated with Maastricht University or S.A. Astatine.",
        ],
      },
    ],
  };
}
