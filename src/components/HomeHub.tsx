import Image from "next/image";
import Link from "next/link";
import { getApps, type MastApp } from "@/content/apps";
import { getCachedUpcomingActivityCards } from "@/lib/activities-cached";
import { getSubscribedIds, type UpcomingActivityCard } from "@/lib/activities";
import { formatDayMonth, formatDayNumber, formatMonthShort, formatTime } from "@/lib/datetime";
import { getMembership } from "@/lib/membership";
import { getSession } from "@/lib/session";
import { CheckIcon } from "@/components/ui/icons";
import ShapeIcon from "@/components/ui/ShapeIcon";

const CARDS = 3;
const ACTIVITIES = "/mastapps/activities";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ActivityCard({ activity: a, going }: { activity: UpcomingActivityCard; going: boolean }) {
  return (
    <Link href={`${ACTIVITIES}/${a.id}`} className={`hub-act${going ? " is-going" : ""}`}>
      {a.poster_url ? (
        <Image src={a.poster_url} alt="" width={128} height={160} sizes="64px" className="hub-act__thumb" />
      ) : (
        <time dateTime={a.starts_at.toISOString()} className="hub-act__thumb hub-act__date">
          <span>{formatDayNumber(a.starts_at)}</span>
          <span>{formatMonthShort(a.starts_at)}</span>
        </time>
      )}
      <span className="hub-act__body">
        <span className="hub-act__name">{a.name}</span>
        <span className="hub-act__when">{formatDayMonth(a.starts_at)} · {formatTime(a.starts_at)}</span>
        {a.location && <span className="hub-act__where">{a.location}</span>}
        {(going || a.members_only) && (
          <span className="hub-act__tags">
            {going && <span className="hub-tag hub-tag--going"><CheckIcon />You&rsquo;re going</span>}
            {a.members_only && <span className="hub-tag">Members only</span>}
          </span>
        )}
      </span>
    </Link>
  );
}

function AppLauncher({ apps }: { apps: MastApp[] }) {
  return (
    <ul className="hub-apps" aria-label="Your MastApps">
      {apps.map((app) => (
        <li key={app.slug}>
          <Link
            href={app.href}
            className="hub-app"
            {...(app.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <ShapeIcon shape={app.shape} tone={app.tone}>{app.icon}</ShapeIcon>
            <span className="hub-app__name">{app.name}</span>
          </Link>
        </li>
      ))}
    </ul>
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
      {session && (
        <div className="hub__apps">
          <AppLauncher apps={getApps(session.user.role === "admin")} />
        </div>
      )}

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
