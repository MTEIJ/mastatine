import Link from "next/link";
import { getCachedUpcomingActivityCards } from "@/lib/activities-cached";
import { getSubscribedIds, type UpcomingActivityCard } from "@/lib/activities";
import { getMembership } from "@/lib/membership";
import { getSession } from "@/lib/session";
import ActivityCard from "@/components/ActivityCard";

const CARDS = 3;
const ACTIVITIES = "/mastapps/activities";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

async function loadHub() {
  const [session, { isMember }] = await Promise.all([getSession(), getMembership()]);
  const activities = await getCachedUpcomingActivityCards(CARDS, isMember).catch((error) => {
    console.error("Failed to load homepage activities:", (error as Error).message);
    return [] as UpcomingActivityCard[];
  });
  const going = session
    ? await getSubscribedIds(session.user.id, activities.map((a) => a.id)).catch((error) => {
        console.error("Failed to load the viewer's subscriptions:", (error as Error).message);
        return new Set<string>();
      })
    : new Set<string>();
  return { session, activities, going };
}

/**
 * The homepage's way into the association's life: the next activities for everyone, and for signed-in people one-tap
 * shortcuts to the MastApps. Signed-out visitors get a reason to sign in instead.
 */
export default async function HomeHub({ top = false }: { /** Leads the page (signed in), instead of following the hero. */ top?: boolean }) {
  const { session, activities, going } = await loadHub();

  return (
    <section className={top ? "hub hub--top" : "hub"} aria-labelledby="hub-title">
      <div className="hub__head">
        <h2 id="hub-title" className="hub__title">Coming up</h2>
        <Link href={ACTIVITIES} className="hub__all">All activities <Arrow /></Link>
      </div>

      {activities.length === 0 ? (
        <p className="hub__empty">Nothing planned right now. Check back soon.</p>
      ) : (
        <ul className="hub-acts">
          {activities.map((a) => (
            <li key={a.id}><ActivityCard activity={a} going={going.has(a.id)} /></li>
          ))}
        </ul>
      )}

      {!session && (
        <div className="hub__invite">
          <p>
            <strong>Join in.</strong> Sign in with just your email to sign up for activities and use the MastApps.
          </p>
          <Link href="/login" className="btn btn-primary btn-sm">Sign in</Link>
        </div>
      )}
    </section>
  );
}
