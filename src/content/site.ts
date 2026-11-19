/**
 * Editorial content for the information pages. Edit freely. No real people are named on purpose:
 * the board is not decided yet, so no board members are listed anywhere on the site.
 */

export const ASTATINE_URL = "https://astatine.utwente.nl";

/** The association was officially founded at the Cratesitting activity. */
export const FOUNDING = {
  date: "12 November 2026",
  iso: "2026-11-12",
  occasion: "Cratesitting",
  place: "Maastricht",
} as const;

export interface Role {
  /** Stable key, stored with board applications. Never change it once people have applied; rename the title instead. */
  key: string;
  title: string;
  /** The boring official name, shown in small print under the title. */
  portfolio?: string;
  /** What this role does for the association. */
  summary: string;
}

export const BOARD: Role[] = [
  {
    key: "chair",
    title: "Chairmast",
    portfolio: "Chair",
    summary: "Leads the board and the general meeting, represents the association and keeps the whole structure standing.",
  },
  {
    key: "secretary",
    title: "Sexytary",
    portfolio: "Secretary",
    summary: "Keeps the minutes, the member administration and the archive. Makes paperwork look good.",
  },
  {
    key: "treasurer",
    title: "Moneymaster",
    portfolio: "Treasurer",
    summary: "Manages the budget, the accounts and the finances of every activity.",
  },
  {
    key: "external",
    title: "Commastioner of External Affairs",
    portfolio: "External Affairs",
    summary: "Builds contacts with companies, sponsors and other associations.",
  },
  {
    key: "internal",
    title: "Commastioner of Internal Affairs",
    portfolio: "Internal Affairs",
    summary: "Looks after the members and the committees, and makes sure everyone feels at home.",
  },
  {
    key: "awareness",
    title: "Mastermind",
    portfolio: "General Board Member",
    summary: "Spreads mast awareness, everywhere, always. No fixed tasks: helps out wherever the board needs it and makes sure nobody walks past a mast without looking up.",
  },
];

export interface Choice {
  value: string;
  label: string;
}

/** Copy and answer options for the board application form on /board. */
export const BOARD_CALL = {
  /** Set to false to close the form; the page then says applications are closed. */
  open: true,
  title: "Apply for the first board",
  intro:
    "Mastatine needs its very first board. No experience needed, just enthusiasm, a bit of time and a deep, unexplainable love for tall metal structures. Fill in the form below. Yes, all of it. Especially the mast photo.",
  hoursPerWeek: [
    { value: "1-3", label: "1 to 3 hours (a light breeze)" },
    { value: "4-8", label: "4 to 8 hours (a steady signal)" },
    { value: "9-15", label: "9 to 15 hours (full reception)" },
    { value: "16+", label: "16+ hours (I live in the mast now)" },
  ] satisfies Choice[],
  promise: "I solemnly swear I will never mast in public.",
} as const;

export interface Pillar {
  title: string;
  text: string;
}

/** What the association does. */
export const PILLARS: Pillar[] = [
  { title: "Social", text: "Drinks, game nights and the occasional crate to sit on. A place to meet people outside the lecture hall." },
  { title: "Educational", text: "Talks, excursions and workshops on masts, towers and the infrastructure behind modern communication." },
  { title: "Community", text: "An international association where every student in Maastricht is welcome, and where everyone can help shape what we do." },
];

export interface Organ {
  title: string;
  text: string;
  href?: string;
}

/** How the association is organised, the way members expect it from a study association. */
export const ORGANISATION: Organ[] = [
  { title: "General Members Meeting", text: "The members decide. The board accounts to them for its policy and its finances." },
  { title: "The Board", text: "The people who run the association day to day.", href: "/board" },
  { title: "Committees", text: "Members who organise activities, the newsletter, the register and more.", href: "/committees" },
  { title: "Members", text: "Everyone who joins. Members vote, take part and can join a committee.", href: "/membership" },
];

export interface Milestone {
  year: string;
  title: string;
  text: string;
}

/** Our story so far, newest last. */
export const HISTORY: Milestone[] = [
  {
    year: "12 November 2026",
    title: "Officially founded",
    text: "M.A. Mastatine is founded at the Cratesitting activity in Maastricht: students, crates and a shared interest in tall things. From this day the Master Association exists. Yes, it was November, and yes, it was No Nut November. For an association built around masten, that is a bold month to be born in. We kept our hands to ourselves and our eyes on the skyline, and we are still standing, tall and proud.",
  },
  {
    year: "Autumn 2026",
    title: "A home online",
    text: "The website goes live with the mast register, a leaderboard and a Mast of the Month, plus activities, sign-ups and the newsletter in one place.",
  },
  {
    year: "Next",
    title: "Growing the association",
    text: "Committees take shape, the first members join and the activity calendar fills up. Want to be part of the early days? Become a member.",
  },
];

export const MEMBERSHIP_PERKS: { title: string; text: string }[] = [
  { title: "Take part", text: "Sign up for member activities and join the community. Some activities are for members only." },
  { title: "Have a say", text: "Members vote at the general meeting and can join a committee or stand for the board." },
  { title: "The newsletter", text: "About four emails a year: the best masts, the news and what is coming up." },
  { title: "A free account", text: "Sign in with your email, no password. Manage your details and your newsletter preference in one place." },
  { title: "Vote and submit", text: "Rate any mast up or down, or add your own with a photo. No account needed." },
  { title: "Merch", text: "Wear the tallest opinions in the room. The shop is run by our print partner." },
];

export const JOIN_STEPS: { title: string; text: string }[] = [
  { title: "Create an account", text: "Sign in with your email address. There is no password." },
  { title: "Request membership", text: "Press the button on this page. It takes one click." },
  { title: "Get approved", text: "The board approves each request. You will see your status on your account page." },
];

export const FAQ: { q: string; a: string }[] = [
  { q: "Who can join?", a: "Any student in Maastricht, and anyone else with an interest in masts, towers and the built environment. Membership is open to all." },
  { q: "Does membership cost anything?", a: "No. Membership and everything on this site is free." },
  { q: "Do I get study credits?", a: "No. Mastatine is a student association, not a course, so there are no credits, only a community and a good excuse to look up." },
  { q: "When was the association founded?", a: `On ${FOUNDING.date}, at our ${FOUNDING.occasion} activity in ${FOUNDING.place}.` },
  { q: "How do I join a committee?", a: "Become a member and tell us which committee interests you. You can also pitch a new one." },
  { q: "Can I delete my account?", a: "Yes, from your account page, at any time. You can also unsubscribe from the newsletter with one click." },
];
