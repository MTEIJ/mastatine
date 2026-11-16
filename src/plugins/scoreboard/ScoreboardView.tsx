import type { PluginViewer } from "../types";
import "./scoreboard.css";
import { markPlayer } from "./actions";
import { canMark, gridRows, rankPlayers, timingSafeEqual, type ScoreboardConfig } from "./logic";
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
 * The board itself: ranked rows with a bar, +1 / undo where this visitor may change things, plus the sheet view of the
 * old Excel. Styled by the .sb-* classes (scoreboard.css); it re-themes itself inside the full-screen page.
 */
export default function ScoreboardView({ token, config, players, viewer, playerKey, interactive }: ScoreboardViewProps) {
  if (players.length === 0) return <p className="sb-board sb-empty">Nobody on the board yet.</p>;
  const ranked = rankPlayers(players);
  const leader = Math.max(1, ranked[0].marks);
  // A full sheet is up to 1000 rows by 80 players: only draw it while it stays a sensible size.
  const sheet = players.every((p) => p.marks <= MAX_SHEET_ROWS) ? gridRows(players) : [];

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
              <span className="sb-rank" aria-label={`Place ${rank}`}>{rank}</span>
              <div className="min-w-0">
                <p className="sb-name">
                  {p.name}
                  {ownKey && <span className="sb-you">(you)</span>}
                </p>
                <div className={`sb-bar${p.marks === 0 ? " sb-bar--empty" : ""}`} aria-hidden>
                  <span style={{ width: `${Math.round((p.marks / leader) * 100)}%` }} />
                </div>
              </div>
              <p className="sb-score">
                {p.marks}
                <small>{p.marks === 1 ? "mark" : "marks"}</small>
              </p>
              {editable && (
                <form action={markPlayer} className="sb-actions">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="player" value={p.id} />
                  {ownKey && <input type="hidden" name="key" value={ownKey} />}
                  <button name="op" value="add" className="sb-btn sb-btn--add" type="submit" aria-label={`Add a mark for ${p.name}`}>
                    +1
                  </button>
                  <button name="op" value="undo" className="sb-btn" type="submit" disabled={p.marks === 0} aria-label={`Undo the last mark for ${p.name}`}>
                    Undo
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
