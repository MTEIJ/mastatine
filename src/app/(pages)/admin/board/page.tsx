import { BOARD, BOARD_CALL } from "@/content/site";
import { choiceLabel, roleTitle } from "@/lib/board-application";
import sql from "@/lib/db";
import { formatDateTime } from "@/lib/datetime";
import { requireAdmin } from "@/lib/session";
import { clearBoardApplications } from "./actions";

interface ApplicationRow {
  user_id: string;
  name: string;
  email: string;
  first_choice: string;
  second_choice: string | null;
  motivation: string;
  ambitions: string;
  study: string;
  hours_per_week: string;
  mast_photo: string;
  mast_location: string;
  superpower: string;
  updated_at: Date;
}

export const instant = false;

export default async function AdminBoard() {
  // Layouts do not re-run on client navigation, so each admin page checks the role itself.
  await requireAdmin();
  const applications = await sql<ApplicationRow[]>`
    SELECT a.user_id, u.name, u.email, a.first_choice, a.second_choice, a.motivation, a.ambitions, a.study, a.hours_per_week,
      a.mast_photo, a.mast_location, a.superpower, a.updated_at
    FROM board_applications a JOIN "user" u ON u.id = a.user_id
    ORDER BY a.created_at
  `;

  // How many people want each role, as first or second choice.
  const interest = BOARD.map((role) => ({
    title: role.title,
    first: applications.filter((a) => a.first_choice === role.key).length,
    second: applications.filter((a) => a.second_choice === role.key).length,
  }));

  return (
    <div className="space-y-6">
      <section aria-labelledby="interest-title">
        <h2 id="interest-title" className="text-base font-extrabold">
          Board applications <span className="font-normal text-muted">({applications.length}{BOARD_CALL.open ? ", form open" : ", form closed"})</span>
        </h2>
        <div className="card mt-2 overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted">
                <th className="p-3">Function</th>
                <th className="p-3">1st choice</th>
                <th className="p-3">2nd choice</th>
              </tr>
            </thead>
            <tbody>
              {interest.map((row) => (
                <tr key={row.title} className="border-t border-line">
                  <td className="p-3 font-semibold">{row.title}</td>
                  <td className="p-3">{row.first}</td>
                  <td className="p-3">{row.second}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {applications.length === 0 ? (
        <p className="text-muted">No applications yet.</p>
      ) : (
        <ul className="space-y-4">
          {applications.map((a) => (
            <li key={a.user_id} className="card grid gap-4 p-4 sm:grid-cols-[12rem_1fr]">
              <a href={a.mast_photo} target="_blank" rel="noreferrer" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element -- /uploads image, already re-encoded */}
                <img src={a.mast_photo} alt={`Favourite mast of ${a.name}`} className="max-h-56 w-full rounded-xl border border-line object-cover" />
              </a>
              <div className="min-w-0 space-y-2 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-extrabold">{a.name}</h3>
                  <span className="text-muted">{formatDateTime(a.updated_at)}</span>
                </div>
                <p>
                  <a href={`mailto:${a.email}`} className="break-all text-accent-text underline underline-offset-2">{a.email}</a>
                  {a.study && <> · {a.study}</>}
                </p>
                <p>
                  <strong>{roleTitle(a.first_choice)}</strong>
                  {a.second_choice && <>, then {roleTitle(a.second_choice)}</>}
                  {" · "}
                  {choiceLabel(BOARD_CALL.hoursPerWeek, a.hours_per_week)}
                </p>
                <p className="font-semibold">Motivation</p>
                <p className="whitespace-pre-wrap rounded-xl bg-soft p-3">{a.motivation}</p>
                {a.ambitions && (
                  <>
                    <p className="font-semibold">Ambitions</p>
                    <p className="whitespace-pre-wrap rounded-xl bg-soft p-3">{a.ambitions}</p>
                  </>
                )}
                <dl className="grid gap-x-4 gap-y-1 text-muted sm:grid-cols-[auto_1fr]">
                  {a.mast_location && <><dt>Mast location</dt><dd className="text-ink">{a.mast_location}</dd></>}
                  {a.superpower && <><dt>Superpower</dt><dd className="text-ink">{a.superpower}</dd></>}
                </dl>
              </div>
            </li>
          ))}
        </ul>
      )}

      {applications.length > 0 && (
        <form action={clearBoardApplications} className="card max-w-2xl space-y-3 p-4">
          <h2 className="text-base font-extrabold">Board chosen?</h2>
          <p className="text-sm text-muted">
            The privacy statement promises applications are removed once the board is chosen. This deletes all of them, and their
            mast photos, for good.
          </p>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="confirm" required className="mt-1" />
            <span>Yes, delete all {applications.length} applications.</span>
          </label>
          <button type="submit" className="btn btn-secondary text-danger">Delete all applications</button>
        </form>
      )}
    </div>
  );
}
