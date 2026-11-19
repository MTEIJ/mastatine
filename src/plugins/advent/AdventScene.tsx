import { Billboard, Building, vars } from "./Landmarks";
import Avatar from "./Avatar";
import { MAX_TOKENS_PER_TILE, buildTiles, type Walker } from "./logic";
import { SLAB, TILT_DEGREES, TURN_DEGREES, graveSpots, pawnSpots, sceneLayout, sceneMetrics, scenery } from "./scene";
import "./scene.css";

/** Height of a space above the ground, in cells: pawns and graves stand on top of it. */
const SPACE_TOP = 0.1;
/** The "+n" badge for a crowded space: to the right of the pawns, so it never covers the space's number. */
const MORE_SPOT = { dx: 0.24, dy: -0.37 };

/**
 * The 3D campus map: a snowy slab seen isometrically, a cobbled road of red and green spaces from the front corner to
 * the back, and models of real University of Twente buildings along the back edges (Landmarks.tsx). Players are round
 * standees with their photo or initials; a fallen player is a gravestone with their face on it, greyed out. Plain CSS 3D, no script, so the page stays a
 * server component. Geometry in scene.ts, looks in scene.css.
 */
export default function AdventScene({ days, walkers, today }: { days: number; walkers: readonly Walker[]; today: number | null }) {
  const layout = sceneLayout(days);
  const metrics = sceneMetrics(layout);
  const { landmarks, trees } = scenery(layout);
  const tiles = buildTiles(walkers, days);
  const fallen = walkers.filter((w) => w.diedOn !== null).length;
  const finish = layout.tiles[layout.tiles.length - 1];

  return (
    <div className="ac-stage">
      <div
        className="ac-scene"
        role="img"
        aria-label={`Map of the ${days} days, with ${walkers.length - fallen} players on the road and ${fallen} fallen. The list below has the details.`}
        style={vars({
          "--gw": layout.width,
          "--gh": layout.height,
          "--wu": metrics.widthUnits,
          "--sh": metrics.stageHeight,
          "--ptop": metrics.planeTop,
          "--slab": SLAB,
          "--tilt": `${TILT_DEGREES}deg`,
          "--turn": `${TURN_DEGREES}deg`,
        })}
      >
        <div className="ac-plane">
          <i className="ac-ground" />
          <i className="ac-slab ac-slab--y" />
          <i className="ac-slab ac-slab--x" />

          {layout.roads.map((r) => (
            <i key={`road-${r.x}-${r.y}`} className="ac-road" style={vars({ "--x": r.x, "--y": r.y, "--w": r.w, "--d": r.d })} />
          ))}

          {layout.tiles.map((t) => {
            const kind = t.day === 0 ? "start" : t.day === days ? "finish" : t.day % 2 === 0 ? "green" : "red";
            // Someone stands or lies here: the number moves to the front of the coin so the stone or pawn does not cover it.
            const taken = tiles[t.day].walkers.length + tiles[t.day].graves.length > 0;
            return (
              <span key={`space-${t.day}`} className={`ac-space ac-space--${kind}${t.day === today ? " ac-space--today" : ""}${taken ? " ac-space--taken" : ""}`} style={vars({ "--x": t.x, "--y": t.y })}>
                <span className="ac-num">{t.day === 0 ? "START" : t.day}</span>
              </span>
            );
          })}

          {trees.map((t) => (
            <Billboard key={`tree-${t.x}-${t.y}`} x={t.x} y={t.y}>
              <span className="ac-tree" style={vars({ "--s": t.size })} />
            </Billboard>
          ))}
          {landmarks.map((b) => <Building key={b.kind} b={b} />)}

          <Billboard x={finish.x + 0.95} y={finish.y + 0.1}>
            <span className="ac-xmas" />
          </Billboard>

          {layout.tiles.map((t) => {
            const tile = tiles[t.day];
            const graves = tile.graves.slice(0, 3);
            const shown = tile.walkers.slice(0, MAX_TOKENS_PER_TILE);
            const more = tile.walkers.length - shown.length;
            const g = graveSpots(graves.length);
            const p = pawnSpots(shown.length);
            const cx = t.x + 0.5;
            const cy = t.y + 0.5;
            return [
              ...graves.map((w, i) => (
                <Billboard key={`grave-${w.id}`} x={cx + g.spots[i].dx} y={cy + g.spots[i].dy} lift={SPACE_TOP}>
                  <span className="ac-grave-spot" style={vars({ "--s": g.scale })} title={`${w.name} failed on day ${w.diedOn}`}>
                    <span className="ac-grave">
                      <Avatar walker={w} className="ac-disc" />
                    </span>
                    <span className="ac-mound" />
                  </span>
                </Billboard>
              )),
              ...shown.map((w, i) => (
                <Billboard key={`pawn-${w.id}`} x={cx + p.spots[i].dx} y={cy + p.spots[i].dy} lift={SPACE_TOP}>
                  <span className="ac-pawn" style={vars({ "--s": p.scale })}>
                    <Avatar walker={w} className="ac-disc" />
                  </span>
                </Billboard>
              )),
              ...(more > 0
                ? [
                    <Billboard key={`more-${t.day}`} x={cx + MORE_SPOT.dx} y={cy + MORE_SPOT.dy} lift={SPACE_TOP + 0.3}>
                      <span className="ac-more">+{more}</span>
                    </Billboard>,
                  ]
                : []),
            ];
          })}
        </div>
      </div>
    </div>
  );
}
