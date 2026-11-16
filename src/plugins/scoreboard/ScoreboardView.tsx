import type { PluginViewer } from "../types";
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

/** The board itself: ranked list with +1 / undo where this visitor may change things, plus the sheet view of last year's Excel. */
export default function ScoreboardView({ token, config, players, viewer, playerKey, interactive }: ScoreboardViewProps) {
  if (players.length === 0) return <p className="text-muted">Nobody on the board yet.</p>;
  const ranked = rankPlayers(players);
  // A full sheet is up to 1000 rows by 80 players: only draw it while it stays a sensible size.
  const sheet = players.every((p) => p.marks <= MAX_SHEET_ROWS) ? gridRows(players) : [];

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {ranked.map((p) => {
          const ownKey = playerKey !== null && timingSafeEqual(playerKey, p.editKey) ? playerKey : null;
          const editable = interactive && canMark(config.editMode, { isManager: viewer.isManager, playerKey: ownKey }, p);
          return (
            <li key={p.id} className="card flex items-center justify-between gap-3 p-3 sm:p-4">
              <div className="min-w-0">
                <p className="truncate font-extrabold">
                  {p.name}
                  {ownKey && <span className="ml-2 text-sm font-bold text-accent-text">(you)</span>}
                </p>
                <p className="text-sm text-muted tabular-nums">{p.marks} {p.marks === 1 ? "mark" : "marks"}</p>
              </div>
              {editable && (
                <form action={markPlayer} className="flex shrink-0 items-center gap-2">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="player" value={p.id} />
                  {ownKey && <input type="hidden" name="key" value={ownKey} />}
                  <button name="op" value="undo" className="btn btn-secondary btn-sm" type="submit" disabled={p.marks === 0} aria-label={`Undo the last mark for ${p.name}`}>
                    Undo
                  </button>
                  <button name="op" value="add" className="btn btn-primary btn-sm" type="submit" aria-label={`Add a mark for ${p.name}`}>
                    +1
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ol>

      {sheet.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer font-bold">Sheet view</summary>
          <div className="table-wrap mt-3">
            <table className="table">
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
