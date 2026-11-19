import type { ReactNode } from "react";
import type { Walker } from "./logic";
import "./advent.css";

interface AdventPageProps {
  title: string;
  /** The activity's name, or null when the activity is not public. */
  activityName: string | null;
  walkers: readonly Walker[];
  days: number;
  children: ReactNode;
}

/** The standalone full-screen page around the map: a winter night with snow, like the scoreboard's Advent theme. */
export default function AdventPage({ title, activityName, walkers, days, children }: AdventPageProps) {
  const alive = walkers.filter((w) => w.diedOn === null).length;
  const finished = walkers.filter((w) => w.diedOn === null && w.day >= days).length;
  return (
    <div className="ac-page">
      <main id="main" className="ac-wrap">
        <header className="ac-head">
          {activityName && <p className="ac-eyebrow">{activityName}</p>}
          <h1 className="ac-title">{title}</h1>
          <p className="ac-summary">
            {alive} still going · {walkers.length - alive} fallen{finished > 0 && <> · {finished} finished</>}
          </p>
        </header>
        {children}
        <footer className="ac-foot">Updates by itself · M.A. Mastatine</footer>
      </main>
    </div>
  );
}
