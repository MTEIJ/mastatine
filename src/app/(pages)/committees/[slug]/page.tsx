import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommitteeBanner from "@/components/CommitteeBanner";
import { getJoinStatus, getPublicCommittee } from "@/lib/committees";
import { getSession } from "@/lib/session";
import { requestToJoinCommittee } from "../actions";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Field";
import { cardClass } from "@/components/ui/classes";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const committee = await getPublicCommittee((await params).slug);
  return committee ? { title: committee.name, description: committee.description ?? undefined } : {};
}

export const instant = false;

export default async function CommitteePage({ params }: Props) {
  const { slug } = await params;
  const committee = await getPublicCommittee(slug);
  if (!committee) notFound();

  const session = await getSession();
  const status = session ? await getJoinStatus(session.user.id, committee.id) : null;

  return (
    <article>
      <CommitteeBanner url={committee.banner_url} priority className="h-40 sm:h-64" />
      <div className="container-prose py-10 sm:py-14">
        <Link href="/committees" className="text-sm font-medium text-accent-text hover:underline">
          &larr; All committees
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">{committee.name}</h1>
        {committee.description && <p className="mt-4 text-lg text-muted">{committee.description}</p>}

        <h2 className="mt-10 text-sm font-bold uppercase tracking-wide text-accent-text">
          Members ({committee.members.length})
        </h2>
        {committee.members.length === 0 ? (
          <p className="mt-2 text-base text-muted">No members yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {committee.members.map((member, i) => (
              <li key={i} className="rounded-full border border-line bg-soft px-3 py-1 text-sm font-medium">
                {member.name}
                {member.is_chair && <span className="ml-1.5 font-bold text-accent-text">· chair</span>}
              </li>
            ))}
          </ul>
        )}

        <section aria-label="Join" className={cardClass("mt-10 p-6")}>
          <h2 className="text-xl font-bold">Join {committee.name}</h2>
          {status === "member" ? (
            <p className="mt-3 text-base text-muted">You are part of this committee.</p>
          ) : status === "pending" ? (
            <p className="mt-3 text-base text-muted">Your request is with the admins. You will be added once they approve it.</p>
          ) : (
            <form action={requestToJoinCommittee} className="mt-3 space-y-3">
              <input type="hidden" name="committeeId" value={committee.id} />
              <div>
                <Label htmlFor="join-message">Why do you want to join? (optional)</Label>
                <Textarea id="join-message" name="message" className="min-h-24" maxLength={1000} />
              </div>
              <Button type="submit" variant="primary">
                {session ? "Ask to join" : "Sign in to ask to join"}
              </Button>
            </form>
          )}
        </section>
      </div>
    </article>
  );
}
