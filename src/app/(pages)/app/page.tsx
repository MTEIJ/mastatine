import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import ActivityCard from "@/components/ActivityCard";
import ActivityCountdown from "@/components/ActivityCountdown";
import MastatineLogo from "@/classic/MastatineLogo";
import { getCachedUpcomingActivityCards } from "@/lib/activities-cached";
import { getMyNextActivity, getSubscribedIds, type UpcomingActivityCard } from "@/lib/activities";
import { formatDateTime, formatDayNumber, formatMonthShort } from "@/lib/datetime";
import { getMembership } from "@/lib/membership";
import { APP_HOME } from "@/lib/paths";
import { getSession, requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Today", robots: { index: false } };

export const instant = false;

const COMING_UP = 4;
const ACTIVITIES = "/mastapps/activities";

/** What the installed app shows to someone who has not signed in yet. */
function Welcome() {
  return (
    <div className="today-welcome">
      <MastatineLogo size={96} />
      <h1>M.A. Mastatine</h1>
      <p>Sign in to see your activities and use the MastApps.</p>
      <Link href={`/login?next=${encodeURIComponent(APP_HOME)}`} className="btn btn-primary">Sign in</Link>
    </div>
  );
}

function NextForYou({ activity: a }: { activity: UpcomingActivityCard }) {
  const when = formatDateTime(a.starts_at);
  return (
    <article className="today-next">
      <Link href={`${ACTIVITIES}/${a.id}`} className="today-next__main">
        {a.poster_url ? (
          <Image src={a.poster_url} alt="" width={192} height={240} sizes="96px" className="today-next__thumb" />
        ) : (
          <time dateTime={a.starts_at.toISOString()} className="today-next__thumb today-next__date">
            <span>{formatDayNumber(a.starts_at)}</span>
            <span>{formatMonthShort(a.starts_at)}</span>
          </time>
        )}
        <span className="today-next__body">
          <span className="today-next__count">
            <ActivityCountdown startsAt={a.starts_at.toISOString()} endsAt={a.ends_at?.toISOString() ?? null} fallback={when} />
          </span>
          <span className="today-next__name">{a.name}</span>
          <span className="today-next__meta">{when}{a.location ? ` · ${a.location}` : ""}</span>
        </span>
      </Link>
      <div className="today-next__actions">
        <a href={`${ACTIVITIES}/${a.id}/event.ics`} className="btn btn-secondary btn-sm">Add to calendar</a>
      </div>
    </article>
  );
}

export default async function TodayPage(props: { searchParams: Promise<{ source?: string }> }) {
  // The app is only for the installed app (see APP_HOME): in a browser tab the website is the experience.
  if ((await props.searchParams).source !== "pwa") redirect("/");

  if (!(await getSession())) return <Welcome />;
  const { user } = await requireUser({ next: APP_HOME });

  const { isMember } = await getMembership();
  const [mine, upcoming] = await Promise.all([
    getMyNextActivity(user.id).catch((error) => {
      console.error("Failed to load the user's next activity:", (error as Error).message);
      return null;
    }),
    getCachedUpcomingActivityCards(COMING_UP + 1, isMember).catch((error) => {
      console.error("Failed to load upcoming activities:", (error as Error).message);
      return [] as UpcomingActivityCard[];
    }),
  ]);
  const coming = upcoming.filter((a) => a.id !== mine?.id).slice(0, COMING_UP);
  const going = await getSubscribedIds(user.id, coming.map((a) => a.id)).catch(() => new Set<string>());

  return (
    <div className="today">
      <h1 className="sr-only">Today</h1>

      <section aria-labelledby="today-next">
        <h2 id="today-next" className="today__label">Next for you</h2>
        {mine ? (
          <NextForYou activity={mine} />
        ) : (
          <p className="today-empty">
            You have not joined an activity yet. <Link href={ACTIVITIES} className="font-bold text-accent-text underline underline-offset-2">Find one</Link>.
          </p>
        )}
      </section>

      <section aria-labelledby="today-coming">
        <div className="hub__head">
          <h2 id="today-coming" className="today__label">Coming up</h2>
          <Link href={ACTIVITIES} className="hub__all">All activities</Link>
        </div>
        {coming.length === 0 ? (
          <p className="today-empty">Nothing else is planned right now.</p>
        ) : (
          <ul className="today-list">
            {coming.map((a) => (
              <li key={a.id}><ActivityCard activity={a} going={going.has(a.id)} /></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
