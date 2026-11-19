import type { Metadata } from "next";
import Link from "next/link";
import CommitteeBanner from "@/components/CommitteeBanner";
import PageHeader from "@/components/ui/PageHeader";
import { getPublicCommittees, type PublicCommittee } from "@/lib/committees";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const metadata: Metadata = {
  title: "Committees",
  description: "The committees that keep M.A. Mastatine running.",
};

// Committees and their members are managed in the admin, so this page is rendered per request.

async function loadCommittees(): Promise<PublicCommittee[]> {
  try {
    return await getPublicCommittees();
  } catch (error) {
    console.error("Failed to load committees:", (error as Error).message);
    return [];
  }
}

export const instant = false;

export default async function CommitteesPage() {
  const committees = await loadCommittees();

  return (
    <>
      <PageHeader
        title="Committees"
        intro="Committees are where members make things happen: organising activities, writing the newsletter, keeping the register. Every member can join one."
      />
      <div className="container-page">
        <ul className="grid gap-5 sm:grid-cols-2">
          {committees.map((committee) => (
            <li key={committee.id} className={cardClass("flex flex-col overflow-hidden")}>
              <CommitteeBanner url={committee.banner_url} className="h-32" />
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-xl font-bold">
                  <Link href={`/committees/${committee.slug}`} className="hover:underline">{committee.name}</Link>
                </h2>
                {committee.description && <p className="mt-3 line-clamp-3 text-base text-muted">{committee.description}</p>}
                <p className="mt-auto pt-4 text-sm font-medium text-muted">
                  {committee.members.length} {committee.members.length === 1 ? "member" : "members"}
                </p>
                <Link href={`/committees/${committee.slug}`} className={buttonClass({ variant: "secondary" }, "mt-3 self-start")}>
                  View committee
                </Link>
              </div>
            </li>
          ))}
          <li className={cardClass("flex flex-col justify-between border-dashed p-6")}>
            <div>
              <h2 className="mt-2 text-xl font-bold">Start a committee</h2>
              <p className="mt-3 text-base text-muted">Got an idea that involves tall things? Tell us and we will probably say yes.</p>
            </div>
            <Link href="/contact" className={buttonClass({ variant: "secondary" }, "mt-5 self-start")}>
              Pitch it to us
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
}
