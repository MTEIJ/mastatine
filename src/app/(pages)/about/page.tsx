import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { ASTATINE_URL, FOUNDING, ORGANISATION, PILLARS } from "@/content/site";
import { cardClass } from "@/components/ui/classes";

export const metadata: Metadata = {
  title: "About us",
  description: "About M.A. Mastatine, the Master Association in Maastricht for masts, towers and pylons: our mission, how we are organised and how to take part.",
};

export const instant = false;

const FACTS: { label: string; value: React.ReactNode }[] = [
  { label: "Name", value: "M.A. Mastatine, the Master Association" },
  { label: "Founded", value: <time dateTime={FOUNDING.iso}>{FOUNDING.date}</time> },
  { label: "Seat", value: FOUNDING.place },
  { label: "Language", value: "English" },
  { label: "Membership", value: "Free and open to everyone" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="About us"
        intro={`M.A. Mastatine is the Master Association in Maastricht. Founded on ${FOUNDING.date}, we bring students together around masts, towers and pylons.`}
      />

      <div className="container-prose prose-lite">
        <h2>Our mission</h2>
        <p>
          We help students build a community, grow personally and professionally, and get to know the landscape around them, from the
          Sint Pietersberg to the Maas, one mast at a time. We are an international, non-profit student association, and every student
          in Maastricht is welcome.
        </p>
        <p>
          The name combines <em>mast</em> with an <em>-atine</em> ending, in the style of the chemical elements. Read how we started in
          our <Link href="/history">history</Link>.
        </p>
      </div>

      <div className="container-page mt-12">
        <h2 className="text-2xl font-bold">What we do</h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-3">
          {PILLARS.map((pillar) => (
            <li key={pillar.title} className={cardClass("p-6")}>
              <h3 className="text-xl font-extrabold">{pillar.title}</h3>
              <p className="mt-2 text-base text-muted">{pillar.text}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="container-page mt-16">
        <h2 className="text-2xl font-bold">How we are organised</h2>
        <ul className="mt-5 grid gap-5 sm:grid-cols-2">
          {ORGANISATION.map((organ) => (
            <li key={organ.title} className={cardClass("p-6")}>
              <h3 className="text-xl font-extrabold">{organ.title}</h3>
              <p className="mt-2 text-base text-muted">{organ.text}</p>
              {organ.href && (
                <Link href={organ.href} className="mt-3 inline-block font-semibold text-accent-text underline underline-offset-2">
                  Read more
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="container-prose mt-16">
        <h2 className="text-2xl font-bold">Association at a glance</h2>
        <dl className="mt-5 divide-y divide-line border-y border-line">
          {FACTS.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1 py-3 sm:flex-row sm:gap-6">
              <dt className="font-semibold sm:w-40">{fact.label}</dt>
              <dd className="text-muted">{fact.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-base text-muted">
          Legal details and how to reach us are on the <Link className="underline underline-offset-2" href="/contact">contact page</Link>.
        </p>
      </div>

      <div className="container-prose prose-lite mt-16">
        <h2>Take part</h2>
        <ul>
          <li>
            <strong>Become a member.</strong> It is free. <Link href="/membership">Request membership</Link> with your account and the
            board approves it. Some activities are for members only.
          </li>
          <li>
            <strong>Join a committee.</strong> See the <Link href="/committees">committees</Link> or pitch your own.
          </li>
          <li>
            <strong>Stay informed.</strong> The <Link href="/newsletter">newsletter</Link> is open to anyone: just confirm your email
            address.
          </li>
          <li>
            <strong>Submit and vote on masts.</strong> Add a photo, a name and, if you know it, the height. Rate masts up or down.
            We remove metadata such as GPS coordinates from every photo.
          </li>
        </ul>

        <h2>Safety</h2>
        <p>
          Masts are dangerous, often private property and sometimes live with high voltage. Photograph them from the ground and from
          a public place. <strong>Never climb a mast.</strong> A good photo is not worth it.
        </p>

        <h2>Moderation</h2>
        <p>
          Submissions are filtered for offensive language, and the board can edit or remove anything. If a photo shows you, or something
          that should not be public, tell us and we will take it down.
        </p>

        <p id="disclaimer" className="scroll-mt-28 text-xs text-muted">
          M.A. Mastatine is an independent student initiative and is not affiliated with, endorsed by or connected to Universiteit
          Maastricht or to S.A. Astatine (University of Twente,{" "}
          <a className="underline underline-offset-2" href={ASTATINE_URL} target="_blank" rel="noopener noreferrer">astatine.utwente.nl</a>
          ). Our stickers and merch are set in the Astatine typeface, used with their permission. Some content on this site is
          humorous and fictional. Concerns? <Link className="underline underline-offset-2" href="/contact">Contact us</Link>.
        </p>
      </div>
    </>
  );
}
