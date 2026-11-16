import type { DocSpec } from "./render";

export const HOUSE_RULES: DocSpec = {
  category: "house_rules",
  title: "House rules of M.A. Mastatine",
  description: "Huishoudelijk reglement: how membership, meetings, committees, activities and money work day to day.",
  version: "Draft 1",
  date: "2026-11-16",
  visibility: "members",
  status: "Draft, to be adopted by the General Members Meeting",
  sections: [
    {
      heading: "1. Purpose",
      blocks: [
        "These house rules explain how the statutes work in practice. They cannot conflict with the statutes or the law. If they do, the statutes and the law win. Terms like “board”, “GMM” and “member” mean the same here as in the statutes.",
      ],
    },
    {
      heading: "2. Membership",
      blocks: [
        [
          "Anyone can request membership through their account on the website. Membership is free.",
          "The board decides on each request. If a request is declined, the person is told, and may ask again after 30 days.",
          "A member can end their membership at any time from their account page, or by writing to the board.",
          "The association may end the membership of a member who has been inactive (has not used the website or taken part in anything) for five years. That person can request membership again at any time.",
          "A member whose membership ends is told by email. Dismissal for serious misconduct follows Article 7 of the statutes, including the right to appeal to the GMM.",
        ],
      ],
    },
    {
      heading: "3. The General Members Meeting",
      blocks: [
        [
          "The board publishes the notice, agenda and all documents for a GMM at least fourteen days in advance, by email to all members and on the Documents page.",
          "Members may add items to the agenda until seven days before the meeting, by writing to the secretary. The board adds them and tells members.",
          "A meeting can only vote on items that are on the agenda. Urgent items that are not may be discussed under “any other business” but cannot be decided without the agreement of everyone present.",
          "The secretary records the minutes, which the next GMM adopts. Adopted minutes are published for members in the Documents section.",
          "The chairman keeps order. A member who disrupts the meeting can be asked to leave by the chairman after one warning.",
        ],
      ],
    },
    {
      heading: "4. The board",
      blocks: [
        [
          "The board meets at least once a month during the academic year. The secretary keeps the minutes and action points.",
          "The chairman leads the board and the GMM and represents the association. The secretary looks after the member administration, the minutes and the archive. The treasurer manages the money. The fourth board member looks after educational and external affairs.",
          "Board members give each other a proper handover when their term ends: access to accounts, files, logins and an overview of work in progress.",
          "The board reports to the members at least once per term in the newsletter or at a GMM.",
        ],
      ],
    },
    {
      heading: "5. Committees",
      blocks: [
        [
          "The board sets up committees and decides their task. A committee has a chair, appointed by the board in agreement with the committee.",
          "Every member may ask to join a committee through the website. The board approves or declines the request, after hearing the committee chair.",
          "A committee works within the budget the board gives it, reports to the board, and keeps minutes of its meetings.",
          "A committee may be dissolved by the board when its task is done or when it no longer works. The board tells the members involved.",
        ],
      ],
    },
    {
      heading: "6. Activities",
      blocks: [
        [
          "Every activity has an organiser (a committee or the board) who sets the date, place, costs, maximum number of participants and who can take part, before the activity is announced.",
          "Sign-ups happen through the website. Members can sign up for member-only activities. If an activity is full, people can go on a waiting list.",
          "Someone who signed up and cannot come cancels in time, through the website. The organiser may charge back costs it cannot recover when someone does not show up without cancelling.",
          "Alcohol is only served to people aged 18 and older, as the law requires. Organisers check this where it is in doubt.",
          "At every activity there is at least one organiser who knows the code of conduct and the complaints procedure, and who can be approached with questions or problems.",
          "Organisers think about safety: for example, opening hours, travel home, and what happens in an emergency. Excursions, especially to sites with heights or heavy equipment, follow the safety rules of the host.",
        ],
      ],
    },
    {
      heading: "7. Money",
      blocks: [
        [
          "Only the treasurer, or someone the board has authorised, may spend money for the association.",
          "Expenses must be agreed in advance by the treasurer when they are above €50 or are not in the budget. Every payment needs a receipt or invoice. Receipts are attached to the entry in the finance app.",
          "Money is paid in and out through the association’s bank account. Cash is only used when there is no other way, and is counted and recorded by two people.",
          "Payments over €250 need approval from a second board member.",
          "The treasurer keeps the books up to date and gives the board an overview every month.",
          "Reimbursements are paid within thirty days, on the basis of a receipt.",
          "The audit committee has access to all financial records at any time.",
        ],
      ],
    },
    {
      heading: "8. Use of the website and apps",
      blocks: [
        [
          "Members sign in with their email address. Accounts are personal: do not share your sign-in link.",
          "Content on the site, such as quotes, masts and photos, follows the site rules and the code of conduct.",
          "Members-only content, including documents, quotes and minutes, may not be passed on outside the association without permission of the board.",
          "Someone who is quoted in the quote app and wants a quote removed or changed can ask the board, which will do so.",
          "Administrators of the website only use their access for the work of the association.",
        ],
      ],
    },
    {
      heading: "9. Name, logo and merch",
      blocks: [
        "The name “M.A. Mastatine”, the logo and the artwork belong to the association. Members may use them to promote the association. For anything else, including sponsor material and commercial use, they need permission from the board. The association is independent and does not use the name or logo of Maastricht University or any other organisation as its own.",
      ],
    },
    {
      heading: "10. Photographs and recordings",
      blocks: [
        [
          "Photos and videos at activities may be published on the website and social media. If someone asks for a photo of them to be removed, the board removes it as soon as possible.",
          "Nobody records meetings or private conversations without the permission of everyone involved.",
          "At activities where privacy matters, the organiser says so in advance and may ask people not to take photos.",
        ],
      ],
    },
    {
      heading: "11. Personal data",
      blocks: [
        "The association handles personal data as described in its privacy statement. Board members and committee members only use the data they need for their task, do not share it, and delete exports and lists once they are no longer needed. Anyone who finds out that data has been lost or shared by mistake tells the board immediately, so that it can decide whether this must be reported to the Dutch Data Protection Authority and to the people involved.",
      ],
    },
    {
      heading: "12. Complaints and misconduct",
      blocks: [
        "Everyone is expected to follow the code of conduct. Complaints and reports follow the complaints procedure. The board makes sure that the procedure is followed and, where needed, may take measures as set out in the code of conduct.",
      ],
    },
    {
      heading: "13. Amendments and cases not covered",
      blocks: [
        "The GMM may amend these house rules on the proposal of the board or of members, by the majority of the votes cast. In cases that the house rules do not cover, the board decides, and reports on this to the next GMM.",
      ],
    },
  ],
};
