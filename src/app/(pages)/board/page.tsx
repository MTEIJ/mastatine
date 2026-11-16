import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { BOARD } from "@/content/site";

export const metadata: Metadata = {
  title: "The Board",
  description: "The board roles of M.A. Mastatine and what each one does.",
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
