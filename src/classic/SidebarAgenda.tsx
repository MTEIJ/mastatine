import Link from "next/link";
import CalendarSubscribe from "@/components/CalendarSubscribe";
import { getCachedAgenda } from "@/lib/agenda-cached";
import { getMembership } from "@/lib/membership";
import { formatDayNumber, formatMonthShort, formatTime } from "@/lib/datetime";

const AGENDA_ITEMS = 4;

/** Next few activities and agenda items for the desktop sidebar: name, time and place only. Members also see members-only ones. */
export default async function SidebarAgenda() {
  const { isMember } = await getMembership();
  const upcoming = await getCachedAgenda(AGENDA_ITEMS, isMember).catch((error) => {
    console.error("Failed to load the sidebar agenda:", (error as Error).message);
    return [];
  });

  return (
    <section className="agenda" aria-labelledby="agenda-title">
      <h3 id="agenda-title" className="widget-title"><span>Agenda</span></h3>
      {upcoming.length === 0 ? (
        <p className="agenda__empty">Nothing planned right now.</p>
      ) : (
        <ul className="agenda__list">
          {upcoming.map((a) => {
            const content = (
              <>
                <time className="agenda__date" dateTime={a.starts_at.toISOString()}>
                  <span className="agenda__day">{formatDayNumber(a.starts_at)}</span>
                  <span className="agenda__month">{formatMonthShort(a.starts_at)}</span>
                </time>
                <span className="agenda__text">
                  <span className="agenda__name">{a.name}</span>
                  <span className="agenda__meta">{formatTime(a.starts_at)}{a.location ? ` · ${a.location}` : ""}</span>
                </span>
              </>
            );
            return (
              <li key={a.key}>
                {a.href ? <Link href={a.href} className="agenda__item">{content}</Link> : <div className="agenda__item">{content}</div>}
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/mastapps/activities" className="agenda__all">All activities &rarr;</Link>
      <CalendarSubscribe className="cal-btn--inline cal-btn--quiet" />
    </section>
  );
}
