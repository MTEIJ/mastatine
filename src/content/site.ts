/**
 * Editorial content for the static pages. The history and roles are fictional starting copy:
 * edit freely. No real people are named on purpose.
 */

export const ASTATINE_URL = "https://astatine.utwente.nl";

export interface Role {
  title: string;
  /** Secondary portfolio, shown in small print under the title. */
  portfolio?: string;
}

export const BOARD: Role[] = [
  { title: "Chairman" },
  { title: "Secretary", portfolio: "Internal Affairs" },
  { title: "Treasurer" },
  { title: "Educational Affairs", portfolio: "External Affairs" },
];

export interface Milestone {
  year: string;
  title: string;
  text: string;
}

/** Our story so far. */
export const HISTORY: Milestone[] = [
  { year: "2006", title: "Founded in Wyck", text: "A handful of Maastricht students who kept debating the transmission mast visible from their rented room in Wyck, a short walk from the Maas, found the association. The first board meeting is held over a single plate of bitterballen." },
  { year: "2011", title: "The first excursion", text: "For the 1st lustrum, the association takes its first field trip: an afternoon on the Sint Pietersberg, photographing the masts of the Maastricht skyline from the ground. The mast register, a shared photo album, is started that day." },
  { year: "2016", title: "An international community", text: "As the student body grows more international, Mastatine switches its meetings and newsletter to English and welcomes members from well beyond the Netherlands." },
  { year: "2021", title: "The register goes online", text: "The mast register moves from a shared folder to the website, with ratings, a Mast of the Month and a growing gallery of towers and pylons." },
  { year: "2025–26", title: "The 4th lustrum", text: "Twenty years of Mastatine, celebrated under the theme Masten with a year of activities, a new website and a Minecraft server at aaa.mastatine.nl." },
  { year: "12 November 2026", title: "First activity on the new platform", text: "Activities, sign-ups and the newsletter now all run from one place, starting with our activity on the 12th of November." },
];

export const MEMBERSHIP_PERKS: { title: string; text: string }[] = [
  { title: "Vote and submit", text: "No account needed. Rate any mast up or down, or add your own with a photo." },
  { title: "A free account", text: "Sign in with your email, no password. Manage your details and your newsletter preference in one place." },
  { title: "The quarterly newsletter", text: "About four emails a year: the best masts, the news and what is coming up." },
  { title: "Merch", text: "Wear the tallest opinions in the room. The shop is run by our print partner." },
];

export const FAQ: { q: string; a: string }[] = [
  { q: "Who can join?", a: "Any student in Maastricht, and anyone else with an interest in masts, towers and the built environment. Membership is open to all." },
  { q: "Do I get study credits?", a: "No. Mastatine is a student association, not a course, so there are no credits, only a community and a good excuse to look up." },
  { q: "Does membership cost anything?", a: "No. Everything on this site is free." },
  { q: "Can I delete my account?", a: "Yes, from your account page, at any time. You can also unsubscribe from the newsletter with one click." },
];
