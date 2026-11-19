/**
 * Geometry of the 3D campus map, in ground cells. Pure numbers (no React, no CSS), so the component and the tests share it.
 *
 * The ground is seen isometrically: turned 45 degrees and tilted 60 degrees. The two back edges carry a strip of campus
 * buildings; the road with the day spaces snakes over the front part, from the front corner towards the back. Because
 * everything tall stands behind the road, nothing can hide a space or a pawn.
 */

/** Day spaces per row of road. */
export const SCENE_COLUMNS = 5;
/** Depth of the campus strip along the two back edges. */
export const CAMPUS_DEPTH = 1.9;
const CAMPUS_GAP = 0.35;
/** Distance between two rows of road. */
const ROW_STEP = 1.6;
const FRONT_MARGIN = 0.7;
/** Camera: the stylesheet reads both angles from the component, so they live only here. */
export const TURN_DEGREES = 45;
export const TILT_DEGREES = 60;
/** Room above the ground for the tallest building and its name tag. */
const HEADROOM = 3.3;
/** Thickness of the ground slab, shown below the front edges. */
export const SLAB = 0.45;

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

export interface SceneLayout {
  width: number;
  height: number;
  /** Top-left corner of each day's cell. Day 0 (the start) is the front-most cell. */
  tiles: { day: number; x: number; y: number }[];
  /** The road: one piece per row, plus the bends that join the rows. */
  roads: Rect[];
}

export function sceneLayout(days: number, columns: number = SCENE_COLUMNS): SceneLayout {
  const count = days + 1;
  const rows = Math.ceil(count / columns);
  const start = CAMPUS_DEPTH + CAMPUS_GAP;
  const width = round2(start + columns + FRONT_MARGIN);
  const height = round2(start + ROW_STEP * (rows - 1) + 1 + FRONT_MARGIN);
  const rowY = (row: number) => round2(height - FRONT_MARGIN - 1 - row * ROW_STEP);
  // Even rows run from the front-right end to the left, odd rows back again: a snake.
  const columnX = (row: number, pos: number) => round2(start + (row % 2 === 0 ? columns - 1 - pos : pos));

  const tiles = Array.from({ length: count }, (_, day) => {
    const row = Math.floor(day / columns);
    return { day, x: columnX(row, day % columns), y: rowY(row) };
  });

  const roads: Rect[] = [];
  for (let row = 0; row < rows; row++) {
    const xs = tiles.filter((t) => Math.floor(t.day / columns) === row).map((t) => t.x);
    roads.push({ x: Math.min(...xs), y: rowY(row), w: round2(Math.max(...xs) - Math.min(...xs) + 1), d: 1 });
    if (row < rows - 1) {
      roads.push({ x: columnX(row, columns - 1), y: rowY(row + 1), w: 1, d: round2(ROW_STEP + 1) });
    }
  }
  return { width, height, tiles, roads };
}

export interface SceneMetrics {
  /** Width of the drawing in cells: the stage divides its width by this to get the size of one cell. */
  widthUnits: number;
  /** Height of the stage in cells. */
  stageHeight: number;
  /** Where the (unturned) ground element starts, in cells from the top of the stage. */
  planeTop: number;
}

export function sceneMetrics(layout: SceneLayout): SceneMetrics {
  const span = layout.width + layout.height;
  const across = Math.SQRT1_2 * span;
  const tall = across * Math.cos((TILT_DEGREES * Math.PI) / 180);
  return {
    widthUnits: round2(across + 0.4),
    stageHeight: round2(HEADROOM + tall + SLAB + 0.4),
    planeTop: round2(HEADROOM + tall / 2 - layout.height / 2),
  };
}

export const LANDMARK_KINDS = ["horst", "spiegel", "carre", "waaier", "vrijhof", "bastille", "cubicus", "zilverling", "citadel"] as const;
export type LandmarkKind = (typeof LANDMARK_KINDS)[number];

/**
 * Footprint (w along x, d along y) and the highest point in cells, and the name on the tag. Models of real University of
 * Twente buildings, drawn from photos; the parts of each are in Landmarks.tsx. The ones on the back-left edge have their
 * long side along y, so their front faces the viewer there too.
 */
export const LANDMARK_SIZES: Record<LandmarkKind, { label: string; w: number; d: number; h: number }> = {
  horst: { label: "Horsttoren", w: 1.5, d: 1.5, h: 3.75 },
  spiegel: { label: "Spiegel", w: 1.9, d: 1.15, h: 1.55 },
  carre: { label: "Carré", w: 1.5, d: 1.5, h: 1.3 },
  waaier: { label: "De Waaier", w: 1.5, d: 1.6, h: 1.4 },
  vrijhof: { label: "Vrijhof", w: 1.8, d: 1.7, h: 1.0 },
  bastille: { label: "Bastille", w: 1.6, d: 1.6, h: 1.1 },
  cubicus: { label: "Cubicus", w: 1.6, d: 1.6, h: 1.15 },
  zilverling: { label: "Zilverling", w: 1.2, d: 1.9, h: 1.45 },
  citadel: { label: "Citadel", w: 1.4, d: 1.3, h: 1.1 },
};

/**
 * The tower in the back corner, then what lines the back-right edge (along x) and the back-left edge (along y), most
 * recognisable first: a short calendar has a small board and only room for the first few.
 */
const CORNER: LandmarkKind = "horst";
const ALONG_X: LandmarkKind[] = ["spiegel", "carre", "waaier"];
const ALONG_Y: LandmarkKind[] = ["vrijhof", "bastille", "cubicus", "zilverling", "citadel"];

export interface Landmark extends Rect {
  kind: LandmarkKind;
  label: string;
  h: number;
}

export interface Tree {
  /** Where the trunk stands, in cells. */
  x: number;
  y: number;
  size: number;
}

/** The campus strip: buildings from the back corner outwards, then pine trees on whatever room is left. */
export function scenery(layout: SceneLayout): { landmarks: Landmark[]; trees: Tree[] } {
  const landmarks: Landmark[] = [];
  const trees: Tree[] = [];
  const add = (kind: LandmarkKind, x: number, y: number) => landmarks.push({ kind, ...LANDMARK_SIZES[kind], x: round2(x), y: round2(y) });
  const centred = (size: number) => (CAMPUS_DEPTH - size) / 2;

  const corner = LANDMARK_SIZES[CORNER];
  add(CORNER, centred(corner.w), centred(corner.d));

  let x = CAMPUS_DEPTH + 0.15;
  for (const kind of ALONG_X) {
    const size = LANDMARK_SIZES[kind];
    if (x + size.w > layout.width - 0.15) break;
    add(kind, x, centred(size.d));
    x += size.w + 0.35;
    // A pine in the gap after it, at the front of the strip.
    if (x < layout.width - 0.2) trees.push({ x: round2(x - 0.175), y: 1.7, size: 0.85 });
  }
  for (let i = 0; x + 0.4 < layout.width - 0.1; i++, x += 0.7) {
    trees.push({ x: round2(x + 0.3), y: i % 2 === 0 ? 1.25 : 0.75, size: i % 3 === 1 ? 1.2 : 0.95 });
  }

  let y = CAMPUS_DEPTH + 0.15;
  for (const kind of ALONG_Y) {
    const size = LANDMARK_SIZES[kind];
    if (y + size.d > layout.height - 0.15) break;
    add(kind, centred(size.w), y);
    y += size.d + 0.35;
    if (y < layout.height - 0.2) trees.push({ x: 1.7, y: round2(y - 0.175), size: 0.85 });
  }
  for (let i = 0; y + 0.4 < layout.height - 0.1; i++, y += 0.7) {
    trees.push({ x: i % 2 === 0 ? 1.25 : 0.75, y: round2(y + 0.3), size: i % 3 === 1 ? 1.2 : 0.95 });
  }
  return { landmarks, trees };
}

/** One flat wall of a round tower: turned `turn` degrees, `width` cells wide, `shade` as a brightness (1 = fully lit). */
export interface Facet {
  turn: number;
  width: number;
  shade: number;
}

/**
 * A round tower as `sides` flat walls, only those facing the viewer (the camera looks from the +x, +y corner). Lit
 * like the boxes: walls facing +y in full light, walls facing +x at 0.74.
 */
export function towerFacets(radius: number, sides = 16): Facet[] {
  const width = round2(2 * radius * Math.tan(Math.PI / sides) + 0.01);
  const facets: Facet[] = [];
  for (let i = 0; i < sides; i++) {
    const normal = (360 / sides) * i;
    const rad = (normal * Math.PI) / 180;
    if (Math.cos(rad - Math.PI / 4) < -0.3) continue;
    facets.push({ turn: round2(normal - 90), width, shade: round2(0.74 + 0.26 * Math.sin(rad) - 0.12 * Math.max(0, -Math.sin(rad))) });
  }
  return facets;
}

export interface Spot {
  dx: number;
  dy: number;
}

/** An offset given as "s to the right on screen, t towards the viewer", turned into ground cells. */
const onScreen = (s: number, t: number): Spot => ({ dx: round2((s + t) * Math.SQRT1_2), dy: round2((t - s) * Math.SQRT1_2) });

/** Where pawns stand around the middle of a space, and how big they are (1 = full size). */
export function pawnSpots(count: number): { scale: number; spots: Spot[] } {
  if (count <= 1) return { scale: 1, spots: [onScreen(0, -0.04)] };
  if (count === 2) return { scale: 0.82, spots: [onScreen(-0.2, -0.02), onScreen(0.2, -0.02)] };
  const back = Math.ceil(count / 2);
  const spots = Array.from({ length: count }, (_, i) => {
    const front = i >= back;
    const inRow = front ? count - back : back;
    const pos = front ? i - back : i;
    return onScreen((pos - (inRow - 1) / 2) * 0.3, front ? 0.16 : -0.16);
  });
  return { scale: 0.66, spots };
}

/**
 * Where gravestones stand on a space: on the coin itself, just behind its middle (so the painted number stays readable
 * in front of the stone), side by side and smaller when several fell on the same day. They stay well inside the rim.
 */
export function graveSpots(count: number): { scale: number; spots: Spot[] } {
  const scale = count <= 1 ? 1 : count === 2 ? 0.74 : 0.6;
  const spread = count <= 1 ? 0 : count === 2 ? 0.17 : 0.13;
  const spots = Array.from({ length: count }, (_, i) => {
    const s = (i - (count - 1) / 2) * spread * 2;
    // With three, the middle stone stands a little further back, like a small graveyard.
    return onScreen(s, count === 3 && i === 1 ? -0.08 : -0.02);
  });
  return { scale, spots };
}
