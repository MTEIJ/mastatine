import type { PluginViewer } from "../types";
import { canMark, timingSafeEqual } from "../scoreboard/logic";
import { moveWalker } from "./actions";
import { canChangePhoto, canMove, lastFailDay, standings, type AdventConfig } from "./logic";
import AdventScene from "./AdventScene";
import Avatar from "./Avatar";
import PhotoButton from "./PhotoButton";
import type { StoredWalker } from "./store";
import "./advent.css";

interface AdventMapProps {
  token: string;
  config: AdventConfig;
  walkers: StoredWalker[];
  viewer: PluginViewer;
  /** The personal key from ?p= on the page address, if any. Only ever sent back for the walker it belongs to. */
  playerKey: string | null;
  /** False on the activity page for non-organisers: they see the map, but the public link (the token) is not put in their page. */
  interactive: boolean;
  /** Today's day number, to mark that tile. */
  today: number | null;
  /** How far the calendar has got (progressDay): the latest day someone can be marked as failed on, with automatic movement. */
  progress: number;
}

/** "Failed on day …" with the days that have happened, latest first, and the grave button. Plain form fields: works without script. */
function FailControl({ name, last, today }: { name: string; last: number; today: number | null }) {
  const days = Array.from({ length: last }, (_, i) => last - i);
  return (
    <span className="ac-fail">
      <select name="day" className="ac-select" defaultValue={last} aria-label={`Day ${name} failed on`}>
        {days.map((d) => (
          <option key={d} value={d}>
            day {d}{d === today ? " (today)" : ""}
          </option>
        ))}
      </select>
      <button name="op" value="die" className="ac-btn ac-btn--die" type="submit" aria-label={`${name} failed on the chosen day`}>
        🪦 Failed
      </button>
    </span>
  );
}

/**
 * The tilted 3D campus map (AdventScene), a strip with the names of the fallen, and the list with the controls for
 * whoever may use them: "failed on day …" always, and the step buttons only with manual movement. Whoever may change a player's photo (canChangePhoto) can tap their avatar. Styled by .ac-* in advent.css.
 */
export default function AdventMap({ token, config, walkers, viewer, playerKey, interactive, today, progress }: AdventMapProps) {
  if (walkers.length === 0) return <p className="ac-empty">Nobody is on the map yet.</p>;
  const fallen = standings(walkers).filter((w) => w.diedOn !== null);

  return (
    <div className="ac-board">
      <AdventScene days={config.days} walkers={walkers} today={today} />

      {fallen.length > 0 && (
        <ul className="ac-memoriam" aria-label="In memoriam">
          {fallen.map((w) => (
            <li key={w.id}>🪦 <strong>{w.name}</strong> <span>failed on day {w.diedOn}</span></li>
          ))}
        </ul>
      )}

      <ul className="ac-list">
        {standings(walkers).map((w) => {
          const ownKey = playerKey !== null && timingSafeEqual(playerKey, w.editKey) ? playerKey : null;
          const editable = interactive && canMark(config.editMode, { isManager: viewer.isManager, playerKey: ownKey }, w);
          const dead = w.diedOn !== null;
          const last = lastFailDay(w, config, progress);
          const manual = config.movement === "manual";
          return (
            <li key={w.id} className={`ac-row${ownKey ? " ac-row--me" : ""}${dead ? " ac-row--dead" : ""}`}>
              {interactive && canChangePhoto(viewer, ownKey !== null, w) ? (
                <PhotoButton token={token} walker={{ id: w.id, name: w.name, photo: w.photo }} playerKey={ownKey} />
              ) : (
                <Avatar walker={w} />
              )}
              <div className="ac-who">
                <p className="ac-name">
                  {w.name}
                  {ownKey && <span className="ac-you">(you)</span>}
                </p>
                <p className="ac-status">{dead ? `🪦 Failed on day ${w.diedOn}` : w.day === 0 ? "At the start" : w.day === config.days ? "Made it to the end 🏁" : `On day ${w.day}`}</p>
              </div>
              {interactive && ((editable && !dead && (manual || last >= 1)) || (dead && viewer.isManager)) && (
                <form action={moveWalker} className="ac-actions">
                  <input type="hidden" name="token" value={token} />
                  <input type="hidden" name="walker" value={w.id} />
                  {ownKey && <input type="hidden" name="key" value={ownKey} />}
                  {editable && !dead && manual && (
                    <>
                      <button name="op" value="back" className="ac-btn" type="submit" disabled={!canMove(w, -1, config.days)} aria-label={`Move ${w.name} one day back`}>&minus;</button>
                      <button name="op" value="fwd" className="ac-btn ac-btn--go" type="submit" disabled={!canMove(w, 1, config.days)} aria-label={`Move ${w.name} one day forward`}>+1 day</button>
                    </>
                  )}
                  {editable && !dead && last >= 1 && <FailControl name={w.name} last={last} today={today} />}
                  {dead && viewer.isManager && (
                    <button name="op" value="revive" className="ac-btn" type="submit" aria-label={`Bring ${w.name} back to life`}>Revive</button>
                  )}
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
