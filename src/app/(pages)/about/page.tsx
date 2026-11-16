import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import { ASTATINE_URL } from "@/content/site";

export const metadata: Metadata = {
  title: "About & disclaimer",
  description: "About M.A. Mastatine, the Master Association in Maastricht for masts, towers and pylons: who we are, how it works and how to take part.",
};

export const instant = false;

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="An association for things that are tall"
        intro="Founded in Maastricht in 2006, M.A. Mastatine brings students together around masts, towers and pylons."
      />

      <div className="container-prose prose-lite">
        <h2>Who we are</h2>
        <p>
          Mastatine started in 2006 in a rented room in Wyck, where a few students could not stop arguing about the transmission mast
          outside their window. The name combines <em>mast</em> with an <em>-atine</em> ending, in the style of the chemical elements.
          Twenty years on we keep a register of masts, a leaderboard, a Mast of the Month, activities, a newsletter and a Minecraft
          server. Membership is free and open to every student in Maastricht. Read the full <Link href="/history">history</Link>.
        </p>

        <h2>How it works</h2>
        <ul>
          <li>
            <strong>Submit a mast.</strong> Add a photo, a name and, if you know it, the height. We remove metadata such as GPS
            coordinates from every photo.
          </li>
          <li>
            <strong>Vote.</strong> Rate masts up or down. You do not need an account, and each browser gets one vote per mast.
          </li>
          <li>
            <strong>Mast of the Month.</strong> The mast with the best score over the current month is featured on the home page.
          </li>
          <li>
            <strong>Become a member.</strong> Create a free account with your email, no password, and ask for membership. An admin
            approves each request. Some activities are for members only. The newsletter is open to anyone: just confirm your email address.
          </li>
        </ul>

        <h2>Safety</h2>
        <p>
          Masts are dangerous, often private property and sometimes live with high voltage. Photograph them from the ground and from
          a public place. <strong>Never climb a mast.</strong> A good photo is not worth it.
        </p>

        <h2>Moderation</h2>
        <p>
          Submissions are filtered for offensive language, and admins can edit or remove anything. If a photo shows you, or something
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
