import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { BOARD } from "@/content/site";
import { getPublicCommittees, type PublicCommittee } from "@/lib/committees";

export const metadata: Metadata = {
  title: "The Board",
  description: "The board of M.A. Mastatine: who runs the association day to day and what each role does.",
};

export const instant = false;

/** Board members are the members of the "Board" committee, managed in the admin. */
async function loadBoard(): Promise<PublicCommittee | null> {
  try {
    const committees = await getPublicCommittees();
    return committees.find((c) => c.name.trim().toLowerCase() === "board") ?? null;
  } catch (error) {
    console.error("Failed to load the board:", (error as Error).message);
    return null;
  }
}

export default async function BoardPage() {
  const board = await loadBoard();
  const members = board?.members ?? [];

  return (
    <>
      <PageHeader
        title="The Board"
        intro="The first board of M.A. Mastatine. Four people who run the association day to day and answer to the members."
      />
      <div className="container-page">
        {members.length > 0 && (
          <section aria-labelledby="board-members" className="mb-12">
            <h2 id="board-members" className="text-2xl font-bold">Board members</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {members.map((member, i) => (
                <li key={i} className="rounded-full border border-line bg-soft px-4 py-1.5 text-base font-medium">
                  {member.name}
                  {member.is_chair && <span className="ml-1.5 font-bold text-accent-text">· chair</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        <h2 className="text-2xl font-bold">Roles</h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2">
          {BOARD.map((role) => (
            <li key={role.title} className="card p-6">
              <h3 className="text-xl font-extrabold">{role.title}</h3>
              {role.portfolio && <p className="text-base font-bold text-accent-text">{role.portfolio}</p>}
              <p className="mt-3 text-base text-muted">{role.summary}</p>
            </li>
          ))}
        </ul>

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
