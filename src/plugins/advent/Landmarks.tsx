import type { CSSProperties, ReactNode } from "react";
import { towerFacets, type Landmark, type LandmarkKind } from "./scene";

/** A style object that carries CSS custom properties (React's own type only knows real properties). */
export const vars = (values: Record<string, string | number>): CSSProperties => values as CSSProperties;

/** Something standing upright and facing the viewer (a pawn, a tree, a name tag), with its foot at x, y and `lift` cells up. */
export function Billboard({ x, y, lift = 0, children }: { x: number; y: number; lift?: number; children: ReactNode }) {
  return (
    <span className="ac-bb" style={vars({ "--x": x, "--y": y, "--lift": lift })}>
      <span className="ac-bb-in">{children}</span>
    </span>
  );
}

/** The campus sign every UT building has: the name in blue, the building number on an orange square. */
interface Sign {
  side: "x" | "y";
  name: string;
  num: number;
}

interface BoxProps {
  /** Material: a block in scene.css (`.m-…`) that gives the walls, windows and roof. */
  m: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  /** Height of the bottom above the ground. */
  z?: number;
  sign?: Sign;
}

const signTag = (s: Sign | undefined, side: Sign["side"]) =>
  s?.side === side ? (
    <b className="ac-sign">
      {s.name}
      <em>{s.num}</em>
    </b>
  ) : null;

/** A block with the two walls the camera sees (+y and +x) and a roof, in cells relative to the building. */
function Box({ m, x, y, w, d, h, z = 0, sign }: BoxProps) {
  return (
    <div className={`ac-box m-${m}`} style={vars({ "--x": x, "--y": y, "--w": w, "--d": d, "--h": h, "--z": z })}>
      <i className="ac-face ac-face--y">{signTag(sign, "y")}</i>
      <i className="ac-face ac-face--x">{signTag(sign, "x")}</i>
      <i className="ac-roof" />
    </div>
  );
}

/** A round tower centred on cx, cy. */
function Tower({ m, cx, cy, r, h, z = 0 }: { m: string; cx: number; cy: number; r: number; h: number; z?: number }) {
  return (
    <div className={`ac-cyl m-${m}`} style={vars({ "--cx": cx, "--cy": cy, "--r": r, "--h": h, "--z": z })}>
      {towerFacets(r).map((f) => (
        <i key={f.turn} className="ac-facet" style={vars({ "--a": `${f.turn}deg`, "--s": f.width, "--b": f.shade })} />
      ))}
      <i className="ac-cap" />
    </div>
  );
}

/** A frozen pond (the campus ponds really are used for skating). */
function Ice({ x, y, w, d }: { x: number; y: number; w: number; d: number }) {
  return <i className="ac-ice" style={vars({ "--x": x, "--y": y, "--w": w, "--d": d })} />;
}

/** The parts of each building, in cells from the corner of its footprint (see LANDMARK_SIZES). */
const PARTS: Record<LandmarkKind, () => ReactNode> = {
  // The Horsttoren: a beige slab with brown bands of windows, a taller service shaft and a steel lattice on top.
  horst: () => (
    <>
      <Box m="beige" x={0} y={0} w={1.5} d={0.35} h={0.4} />
      <Box m="horst" x={0.05} y={0.3} w={1.05} d={1.05} h={3.0} />
      <Box m="beige" x={1.1} y={0.55} w={0.32} d={0.32} h={3.45} />
      <Box m="lattice" x={1.09} y={0.54} w={0.34} d={0.34} h={0.3} z={3.45} />
    </>
  ),
  // De Spiegel: six floors of glass curtain wall on a recessed ground floor, a beige stair core and a white roof truss.
  spiegel: () => (
    <>
      <Box m="dark" x={0.12} y={0.12} w={1.66} d={0.9} h={0.3} />
      <Box m="spiegel" x={0} y={0} w={1.9} d={1.15} h={1.1} z={0.3} />
      <Box m="beige" x={1.32} y={1.05} w={0.18} d={0.14} h={1.45} />
      <Box m="truss" x={0.1} y={0.55} w={1.7} d={0.05} h={0.15} z={1.4} />
    </>
  ),
  // Carré: white panels with ribbons of windows and a dark top floor with a red band, on columns over a pond.
  carre: () => (
    <>
      <Ice x={0} y={0.95} w={1.5} d={0.55} />
      <Box m="dark" x={0.15} y={0.15} w={1.1} d={0.9} h={0.3} />
      {[0.12, 0.5, 0.88, 1.26].map((x) => (
        <Box key={x} m="pillar" x={x} y={1.2} w={0.06} d={0.06} h={0.3} />
      ))}
      <Box m="carre" x={0.05} y={0.05} w={1.4} d={1.27} h={1.0} z={0.3} sign={{ side: "y", name: "carré", num: 15 }} />
    </>
  ),
  // De Waaier: the tall white lecture hall and the round wing with two ribbons of windows.
  waaier: () => (
    <>
      <Box m="waaier" x={0.5} y={0} w={1.0} d={1.25} h={1.4} sign={{ side: "y", name: "waaier", num: 12 }} />
      <Tower m="waaier-wing" cx={0.55} cy={1.05} r={0.55} h={0.75} />
    </>
  ),
  // The Vrijhof library: brown brick with red window bands and a round corner, next to the pond with the sunken church
  // tower (the Torentje van Drienerlo, which is drawn as a billboard in Building).
  vrijhof: () => (
    <>
      <Box m="vrijhof" x={0} y={0} w={0.95} d={1.0} h={0.95} />
      <Box m="vrijhof" x={0} y={1.0} w={0.8} d={0.7} h={0.6} />
      <Tower m="vrijhof" cx={0.8} cy={0.22} r={0.2} h={1.0} />
      <Ice x={1.05} y={0.1} w={0.75} d={1.5} />
    </>
  ),
  // The Bastille (Piet Blom): four brick blocks of different heights around a taller core, glass entrance at the front.
  bastille: () => (
    <>
      <Box m="brick" x={0} y={0} w={0.62} d={0.62} h={0.75} />
      <Box m="brick" x={0.98} y={0} w={0.62} d={0.62} h={0.55} />
      <Box m="brick" x={0} y={0.98} w={0.62} d={0.62} h={0.6} />
      <Box m="brick" x={0.98} y={0.98} w={0.62} d={0.62} h={0.8} />
      <Box m="core" x={0.62} y={0.62} w={0.36} d={0.36} h={1.1} />
      <Box m="glass" x={1.02} y={0.64} w={0.5} d={0.32} h={0.42} />
    </>
  ),
  // The Cubicus: brutalist concrete on stilts in a pond, stair towers on the roof and two rusty chimneys.
  cubicus: () => (
    <>
      <Ice x={0} y={0} w={1.6} d={1.6} />
      <Box m="dark" x={0.25} y={0.25} w={1.1} d={1.0} h={0.2} />
      <Box m="concrete" x={0.1} y={0.1} w={1.4} d={1.3} h={0.55} z={0.2} />
      <Box m="concrete" x={0.15} y={0.15} w={0.5} d={0.5} h={0.18} z={0.75} />
      <Box m="concrete" x={0.95} y={0.2} w={0.4} d={0.4} h={0.18} z={0.75} />
      <Box m="concrete" x={0.5} y={0.95} w={0.25} d={0.25} h={0.28} z={0.75} />
      <Box m="rust" x={0.7} y={0.3} w={0.08} d={0.08} h={0.4} z={0.75} />
      <Box m="rust" x={0.7} y={0.55} w={0.08} d={0.08} h={0.33} z={0.75} />
    </>
  ),
  // The Zilverling: silver corrugated cladding with ribbons of grey windows, a glass ground floor and a box on the roof.
  zilverling: () => (
    <>
      <Box m="zilverling" x={0} y={0} w={1.2} d={1.9} h={1.2} sign={{ side: "x", name: "zilverling", num: 11 }} />
      <Box m="plant" x={0.3} y={0.6} w={0.55} d={0.6} h={0.25} z={1.2} />
    </>
  ),
  // The Citadel: a round tower of striped grey brick with square windows, a glass hall and a straight wing.
  citadel: () => (
    <>
      <Box m="citadel" x={0} y={0} w={1.4} d={0.7} h={1.0} sign={{ side: "x", name: "citadel", num: 9 }} />
      <Box m="glass" x={0.75} y={0.6} w={0.3} d={0.35} h={0.95} />
      <Tower m="citadel" cx={0.45} cy={0.85} r={0.44} h={1.1} />
    </>
  ),
};

/** A building with its shadow and, for the Vrijhof, the sunken church tower in the pond. Its name shows on hover only. */
export function Building({ b }: { b: Landmark }) {
  return (
    <>
      <div className={`ac-bld ac-bld--${b.kind}`} title={b.label} style={vars({ "--x": b.x, "--y": b.y, "--w": b.w, "--d": b.d })}>
        <i className="ac-shade" />
        {PARTS[b.kind]()}
      </div>
      {b.kind === "vrijhof" && (
        <Billboard x={b.x + 1.45} y={b.y + 0.9}>
          <span className="ac-torentje" title="Torentje van Drienerlo">
            <i className="ac-tt-cross" />
            <i className="ac-tt-spire" />
            <i className="ac-tt-eave" />
            <i className="ac-tt-base" />
          </span>
        </Billboard>
      )}
    </>
  );
}
