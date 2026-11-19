import type { Metadata } from "next";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import { BOARD, BOARD_CALL } from "@/content/site";
import sql from "@/lib/db";
import { formatDateTime } from "@/lib/datetime";
import { getSession } from "@/lib/session";
import BoardApplicationForm, { type SavedApplication } from "./BoardApplicationForm";
import { withdrawBoardApplication } from "./actions";

export const metadata: Metadata = {
  title: "The Board",
  description: "The board roles of M.A. Mastatine, and the application form for the first board.",
};

export const instant = false;

export default function BoardPage() {
  return (
    <>
      <PageHeader
        title="The Board"
        intro="The board has not been decided yet. These are the roles it will fill: the people who run the association day to day and answer to the members."
      />
      <div className="container-page">
        <h2 className="text-2xl font-bold">Roles</h2>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {BOARD.map((role) => (
            <li key={role.key} className="grid gap-1 py-5 sm:grid-cols-[minmax(0,20rem)_1fr] sm:gap-8">
              <div>
                <h3 className="text-lg font-bold">{role.title}</h3>
                {role.portfolio && <p className="text-sm text-muted">{role.portfolio}</p>}
              </div>
              <p className="text-base text-muted">{role.summary}</p>
            </li>
          ))}
        </ul>

        <div id="apply" className="mt-8 scroll-mt-24">
          <Application />
        </div>

        <p className="mt-12 text-base text-muted">
          The board reports to the members. Questions, ideas or complaints?{" "}
          <Link href="/contact" className="font-semibold text-accent-text underline underline-offset-2">
            Get in touch
          </Link>
          . Want to help out? Join a <Link href="/committees" className="font-semibold text-accent-text underline underline-offset-2">committee</Link>.
        </p>
      </div>
    </>
  );
}

/** The button that opens the form (filled in with what the person sent before), or why there is none. */
async function Application() {
  if (!BOARD_CALL.open) return null;

  const session = await getSession();
  if (!session) {
    return (
      <Link href={`/login?next=${encodeURIComponent("/board#apply")}`} className="btn btn-primary">
        Sign in to apply for the board
      </Link>
    );
  }

  const [saved] = await sql<(SavedApplication & { updated_at: Date })[]>`
    SELECT first_choice, second_choice, motivation, ambitions, study, hours_per_week, mast_photo, mast_location,
      superpower, updated_at
    FROM board_applications WHERE user_id = ${session.user.id}
  `;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Modal
        label={saved ? "Change my board application" : "Apply for the board"}
        title={BOARD_CALL.title}
        description={BOARD_CALL.intro}
        triggerClassName="btn btn-primary"
        dialogClassName="modal--wide"
      >
        <BoardApplicationForm saved={saved ?? null} />
      </Modal>
      {saved && (
        <span className="flex flex-wrap items-center gap-x-3 text-sm text-muted">
          You applied on {formatDateTime(saved.updated_at)}.
          <form action={withdrawBoardApplication}>
            <button type="submit" className="font-semibold text-danger underline underline-offset-2">Withdraw</button>
          </form>
        </span>
      )}
    </div>
  );
}
