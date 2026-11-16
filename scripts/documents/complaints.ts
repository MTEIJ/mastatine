import type { LegalIdentity } from "@/lib/legal";
import type { DocSpec } from "./render";

export function complaintsProcedure(legal: LegalIdentity): DocSpec {
  const mail = legal.email ? ` by email to ${legal.email}` : " through the contact page of the website";

  return {
    category: "complaints",
    title: "Complaints procedure",
    description: "How to make a complaint or report misconduct, who handles it, and what happens next.",
    version: "Draft 1",
    date: "2026-11-16",
    visibility: "public",
    status: "Draft, to be adopted by the board and presented to the General Members Meeting",
    sections: [
      {
        heading: "Who can complain, and about what",
        blocks: [
          "Any member, guest or other person can make a complaint about the association: about the board, a committee, an activity, a member, a decision, or the way personal data is handled. This includes reports of behaviour that does not follow the code of conduct, such as discrimination, harassment or intimidation.",
        ],
      },
      {
        heading: "Step 1: talk about it, if you want to",
        blocks: [
          "Many problems are solved by talking to the person or the organiser involved. You do not have to do this, and you should not feel pressured to do so, especially when it concerns unwanted behaviour.",
        ],
      },
      {
        heading: "Step 2: make a complaint",
        blocks: [
          [
            `You can make a complaint to the board${mail}. Say what happened, when, who was involved and what you would like to happen. Anonymous complaints are taken seriously, but are harder to follow up.`,
            "If the complaint is about a board member, or you do not feel comfortable talking to the board, write to the confidential contact person (see below) or to another board member who is not involved.",
            "If the complaint is about the whole board, write to the audit committee, or ask at least five members to put it on the agenda of a General Members Meeting.",
          ],
          "The board confirms in writing that it received the complaint within five working days.",
        ],
      },
      {
        heading: "The confidential contact person",
        blocks: [
          "The association has a confidential contact person (vertrouwenspersoon): someone who is not on the board, whom the board appoints in agreement with the General Members Meeting, and who is easy to approach. They listen, advise on the options and can help to make a complaint, without doing anything you do not want. What you tell them stays confidential unless you agree to share it, or unless the law or someone’s safety requires it. Their name and contact details are published on the website’s contact page. If no confidential contact person is appointed yet, the board tells members who they can turn to instead.",
        ],
      },
      {
        heading: "How a complaint is handled",
        blocks: [
          [
            "The board (or, when the board is involved, the people named above) looks into the complaint carefully and does not decide before everyone involved has been heard.",
            "Only the people who need to know are told about the complaint, and your details are not shared without your permission.",
            "The board decides within four weeks and tells you in writing what it found and what it will do. If it needs more time, it tells you why and when you can expect a decision.",
            "Measures are taken according to the code of conduct and the statutes. The person complained about is also told the outcome, as far as this concerns them.",
            "Nobody may be treated worse for making a complaint in good faith.",
          ],
        ],
      },
      {
        heading: "If you disagree with the outcome",
        blocks: [
          "You can ask the board in writing to reconsider within four weeks, and you can bring the matter to the next General Members Meeting. Members who are dismissed can appeal to the meeting under the statutes. For complaints about personal data, you can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens). For criminal behaviour you can report to the police, and we will help you with that if you want.",
        ],
      },
      {
        heading: "Records",
        blocks: [
          "The board keeps a record of every complaint, the decision and the measures, in a place only the people handling complaints can reach. Records are kept for two years after the case is closed, or longer when a measure still applies, and then removed. Once a year the board reports to the General Members Meeting how many complaints there were and what was learned, without any details that could identify people.",
        ],
      },
    ],
  };
}
