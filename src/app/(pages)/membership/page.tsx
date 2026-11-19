import type { Metadata } from "next";
import Link from "next/link";
import MembershipRequest from "@/components/MembershipRequest";
import PageHeader from "@/components/ui/PageHeader";
import { FAQ, JOIN_STEPS, MEMBERSHIP_PERKS } from "@/content/site";
import { getMembership } from "@/lib/membership";
import { buttonClass, cardClass } from "@/components/ui/classes";

export const metadata: Metadata = {
  title: "Membership",
  description: "Membership of M.A. Mastatine is free and optional. Here is what you get.",
};


export const instant = false;

export default async function MembershipPage() {
  const membership = await getMembership();
  return (
    <>
      <PageHeader
        title="Membership"
        intro="Join M.A. Mastatine for free. Members take part in activities, have a say in the association and can join a committee."
      />
      <div className="container-page">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MEMBERSHIP_PERKS.map((perk) => (
            <li key={perk.title} className={cardClass("p-6")}>
              <h2 className="text-xl font-extrabold">{perk.title}</h2>
              <p className="mt-2 text-base text-muted">{perk.text}</p>
            </li>
          ))}
        </ul>
        <h2 className="mt-14 text-2xl font-bold">How to join</h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3">
          {JOIN_STEPS.map((step, i) => (
            <li key={step.title} className="rounded-lg border border-line p-5">
              <p className="text-sm font-bold uppercase tracking-wide text-accent-text">Step {i + 1}</p>
              <h3 className="mt-1 text-lg font-bold">{step.title}</h3>
              <p className="mt-1.5 text-base text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <MembershipRequest membership={membership} next="/membership" />
          <Link href="/newsletter" className={buttonClass({ variant: "secondary" })}>
            Subscribe to the newsletter
          </Link>
        </div>
      </div>

      <section className="container-prose mt-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="text-2xl font-bold">
          Questions
        </h2>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {FAQ.map((item) => (
            <div key={item.q} className="py-5">
              <dt className="font-semibold">{item.q}</dt>
              <dd className="mt-1.5 text-muted">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
