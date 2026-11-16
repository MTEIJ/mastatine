import type { PluginViewer } from "../types";
import { markPlayer } from "./actions";
import { barPercent, canMark, canStep, gridRows, rankPlayers, timingSafeEqual, type ScoreboardConfig } from "./logic";
import "./scoreboard.css";
import type { Player } from "./store";

const MAX_SHEET_ROWS = 100;

interface ScoreboardViewProps {
  token: string;
  config: ScoreboardConfig;
  players: Player[];
  viewer: PluginViewer;
  /** The personal key from ?p= on the page address, if any. Only ever sent back for the player it belongs to. */
  playerKey: string | null;
  /** False on the activity page for non-organisers: they see the board, but the public link (the token) is not put in their page. */
  interactive: boolean;
}

/**
 * The board itself: one compact ranked list with a bar per player, small − / +1 buttons where this visitor may change
 * things, and the sheet view of the old Excel. Styled by the .sb-* classes; the theme comes from the page around it.
 */
export default function ScoreboardView({ token, config, players, viewer, playerKey, interactive }: ScoreboardViewProps) {
  if (players.length === 0) return <p className="sb-board sb-empty">Nobody on the board yet.</p>;
  const ranked = rankPlayers(players);
  const leader = Math.max(1, ranked[0].marks);
  const limits = { min: config.minScore, max: config.maxScore };
  // The sheet shows one x per mark, so it only makes sense when everybody starts from zero. A full sheet is up to
  // 1000 rows by 80 players: only draw it while it stays a sensible size.
  const sheet = config.startScore === 0 && players.every((p) => p.marks <= MAX_SHEET_ROWS) ? gridRows(players) : [];

  return (
    <div className="sb-board">
      <ol className="sb-list">
        {ranked.map((p) => {
          const ownKey = playerKey !== null && timingSafeEqual(playerKey, p.editKey) ? playerKey : null;
          const editable = interactive && canMark(config.editMode, { isManager: viewer.isManager, playerKey: ownKey }, p);
          // Ties share a place: the first player with this many marks decides the number.
          const rank = ranked.findIndex((q) => q.marks === p.marks) + 1;
          return (
            <li key={p.id} className={`sb-row${ownKey ? " sb-row--me" : ""}`} data-rank={p.marks > 0 ? rank : undefined}>
              <span className="sb-rank"><span className="sr-only">Place </span>{rank}</span>
              <div className="sb-main">
                <p className="sb-name">
                  {p.name}
                  {ownKey && <span className="sb-you">(you)</span>}
                </p>
                <div className={`sb-bar${p.marks === 0 ? " sb-bar--empty" : ""}`} aria-hidden>
                  <span style={{ width: `${barPercent(p.marks, limits, leader)}%` }} />
                </div>
              </div>
              <p className="sb-score">
                {p.marks}
                {config.maxScore !== null && <span className="sb-of">/ {config.maxScore}</span>}
              </p>
              {editable && (
                <form action={markPlayer} className="sb-actions">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="player" value={p.id} />
                  {ownKey && <input type="hidden" name="key" value={ownKey} />}
                  <button name="op" value="sub" className="sb-btn" type="submit" disabled={!canStep(p.marks, -1, limits)} aria-label={`Take one point from ${p.name}`}>
                    &minus;
                  </button>
                  <button name="op" value="add" className="sb-btn sb-btn--add" type="submit" disabled={!canStep(p.marks, 1, limits)} aria-label={`Give one point to ${p.name}`}>
                    +1
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ol>

      {sheet.length > 0 && (
        <details className="sb-sheet">
          <summary>Sheet view</summary>
          <div className="sb-sheet-scroll">
            <table>
              <thead>
                <tr>{players.map((p) => <th key={p.id}>{p.name}</th>)}</tr>
              </thead>
              <tbody>
                {sheet.map((row, i) => (
                  <tr key={i}>
                    {row.map((marked, j) => <td key={players[j].id} aria-label={marked ? "marked" : "empty"}>{marked ? "x" : ""}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
