import type { CSSProperties, ReactNode } from "react";
import AdventScene from "./AdventScene";
import Avatar from "./Avatar";
import { vars } from "./Landmarks";
import type { Walker } from "./logic";
import { sceneLayout, sceneMetrics } from "./scene";
import "./advent.css";

interface AdventScreenProps {
  title: string;
  days: number;
  walkers: readonly Walker[];
  today: number | null;
}

/** Up to this many names stand still; a longer list rolls like film credits. */
const ROLL_FROM = 8;

/**
 * A column of names. Short lists stand still; long ones roll slowly upwards like the credits of a film, looping
 * seamlessly (the list is drawn twice, the second copy hidden from screen readers).
 */
function CreditRoll({ heading, count, children }: { heading: string; count: number; children: ReactNode }) {
  const rolls = count > ROLL_FROM;
  return (
    <section className="acs-col" aria-label={`${heading}: ${count}`}>
      <h2 className="acs-h">
        {heading} <span className="acs-count">{count}</span>
      </h2>
      <div className={`acs-roll${rolls ? " acs-roll--moving" : ""}`}>
        <div className="acs-track" style={rolls ? ({ "--secs": count * 3.2 } as CSSProperties) : undefined}>
          <ul className="acs-credits">{children}</ul>
          {rolls && (
            <ul className="acs-credits" aria-hidden="true">
              {children}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * The calendar for a screen on the wall (/p/<token>?view=screen). The map is the centrepiece; beside it, film-credit
 * columns of who is still standing and who fell on which day (latest first). Read-only, without site branding, and it
 * refreshes itself.
 */
export default function AdventScreen({ title, days, walkers, today }: AdventScreenProps) {
  const byName = [...walkers].sort((a, b) => a.name.localeCompare(b.name));
  const standing = byName.filter((w) => w.diedOn === null);
  const fallen = byName.filter((w) => w.diedOn !== null).sort((a, b) => (b.diedOn ?? 0) - (a.diedOn ?? 0));
  const metrics = sceneMetrics(sceneLayout(days));

  return (
    <div className="ac-page acs">
      <main className="acs-grid">
        <header className="acs-top">
          <p className="acs-kicker">{today !== null ? `Day ${today} of ${days}` : `${days} days`}</p>
          <h1 className="acs-title">{title}</h1>
        </header>

        <CreditRoll heading="Still standing" count={standing.length}>
          {standing.map((w) => (
            <li key={w.id}>
              <Avatar walker={w} />
              <span className="acs-name">{w.name}</span>
            </li>
          ))}
        </CreditRoll>

        <div className="acs-map" style={vars({ "--ratio": metrics.widthUnits / metrics.stageHeight })}>
          <AdventScene days={days} walkers={walkers} today={today} />
        </div>

        <CreditRoll heading="In memoriam" count={fallen.length}>
          {fallen.length === 0 ? (
            <li className="acs-none">Nobody yet</li>
          ) : (
            fallen.map((w) => (
              <li key={w.id} className="acs-fell">
                <Avatar walker={w} />
                <span className="acs-name">
                  {w.name}
                  <span className="acs-day">day {w.diedOn}</span>
                </span>
              </li>
            ))
          )}
        </CreditRoll>
      </main>
    </div>
  );
}
