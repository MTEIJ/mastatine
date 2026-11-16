import type { DocSpec } from "./render";

export const POLICY_PLAN: DocSpec = {
  category: "policy_plan",
  title: "Policy plan 2026-2027",
  description: "Beleidsplan: what the first board wants to achieve in the first year.",
  version: "Draft 1",
  date: "2026-11-16",
  visibility: "members",
  status: "Draft, to be presented to the General Members Meeting",
  sections: [
    {
      heading: "Starting point",
      blocks: [
        "M.A. Mastatine was founded on 12 November 2026 at the Cratesitting activity in Maastricht. The first year is about building a solid base: a working organisation, members who feel at home, and a calendar of activities that people want to come back to. This plan is deliberately short and sets the direction. The board makes it more specific with the committees, and the General Members Meeting can change it.",
      ],
    },
    {
      heading: "1. Organisation",
      blocks: [
        [
          "Adopt the statutes and house rules at a General Members Meeting, and have the statutes recorded by a notary.",
          "Register the association at the Chamber of Commerce (KvK) and open a bank account in the name of the association.",
          "Appoint an audit committee and a confidential contact person.",
          "Set up the committees that the association needs, and give each one a clear task and a chair.",
          "Keep the administration in order from the start: member register, minutes, finances with receipts, and a handover document for the next board.",
        ],
      ],
    },
    {
      heading: "2. Social",
      blocks: [
        [
          "Organise regular informal activities such as drinks and game nights, so that members get to know each other.",
          "Make sure that these activities are open and welcoming for international students, and in line with the code of conduct.",
          "Keep the activity calendar up to date on the website, so members can sign up easily.",
        ],
      ],
    },
    {
      heading: "3. Educational",
      blocks: [
        [
          "Organise talks, excursions and workshops about masts, towers and the infrastructure behind modern communication.",
          "Build contacts with companies, other associations and the university for these activities.",
          "Share what members learn, for example in the newsletter.",
        ],
      ],
    },
    {
      heading: "4. Community and members",
      blocks: [
        [
          "Welcome new members quickly, and make it easy to find a committee that suits them.",
          "Give members a real say: through the General Members Meeting, through the committees and by asking for input before big decisions.",
          "Keep the website and apps simple, free to use and respectful of members’ privacy.",
          "Send the newsletter about four times a year, with news and what is coming up.",
        ],
      ],
    },
    {
      heading: "5. Finances",
      blocks: [
        [
          "Membership is free. The association funds its activities from sponsorship, merchandise and other income, and spends within the budget approved by the General Members Meeting.",
          "The treasurer keeps clear books, gives the board a monthly overview, and the audit committee checks them.",
          "The first financial year runs from the founding until 31 August 2027. The budget and the first financial statements are presented to the General Members Meeting.",
        ],
      ],
    },
    {
      heading: "6. Looking back",
      blocks: [
        "At the end of the year the board writes an annual report that looks back at this plan: what was achieved, what was not, and why. This forms the basis for the policy plan of the next year.",
      ],
    },
  ],
};
