import type { ReactNode } from "react";
import type { ScoreboardConfig } from "./logic";
import "./scoreboard.css";

interface ScoreboardPageProps {
  title: string;
  /** The activity's name, or null when the activity is not public. */
  activityName: string | null;
  config: ScoreboardConfig;
  playerCount: number;
  /** The scores added up. */
  totalScore: number;
  children: ReactNode;
}

/** The standalone full-screen page around the board. The theme is a data attribute: the colours and decoration live in scoreboard.css. */
export default function ScoreboardPage({ title, activityName, config, playerCount, totalScore, children }: ScoreboardPageProps) {
  return (
    <div className="sb-page" data-sb-theme={config.theme}>
      <main id="main" className="sb-wrap">
        <header className="sb-head">
          {activityName && <p className="sb-eyebrow">{activityName}</p>}
          <h1 className="sb-title">{title}</h1>
          <p className="sb-summary">
            {playerCount} {playerCount === 1 ? "player" : "players"} · {totalScore} in total{config.maxScore !== null && <> · goal {config.maxScore}</>}
          </p>
        </header>
        {children}
        <footer className="sb-foot">Updates by itself · M.A. Mastatine</footer>
      </main>
    </div>
  );
}
