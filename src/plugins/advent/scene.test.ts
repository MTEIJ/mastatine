import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CAMPUS_DEPTH, graveSpots, pawnSpots, sceneLayout, sceneMetrics, scenery, towerFacets, type Rect } from "./scene";

const inside = (px: number, py: number, r: Rect) => px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.d;
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.d && b.y < a.y + a.d;

describe("sceneLayout", () => {
  it("starts at the front corner and snakes to the back", () => {
    const l = sceneLayout(24);
    assert.equal(l.tiles.length, 25);
    const start = l.tiles[0];
    // The start is the front-most cell: the largest x + y.
    assert.ok(l.tiles.every((t) => t.x + t.y <= start.x + start.y));
    // Day 4 ends the first row on the left; day 5 starts the next row there, further back.
    assert.equal(l.tiles[4].x, l.tiles[5].x);
    assert.ok(l.tiles[5].y < l.tiles[4].y);
  });

  it("puts every space on the road and never two in one cell", () => {
    for (const days of [1, 7, 24, 31]) {
      const l = sceneLayout(days);
      assert.equal(new Set(l.tiles.map((t) => `${t.x},${t.y}`)).size, l.tiles.length);
      for (const t of l.tiles) assert.ok(l.roads.some((r) => inside(t.x + 0.5, t.y + 0.5, r)), `day ${t.day} of ${days}`);
    }
  });

  it("keeps the road in front of the campus strip", () => {
    const l = sceneLayout(31);
    for (const t of l.tiles) assert.ok(t.x > CAMPUS_DEPTH && t.y > CAMPUS_DEPTH);
  });
});

describe("sceneMetrics", () => {
  it("grows with the number of days", () => {
    const small = sceneMetrics(sceneLayout(5));
    const big = sceneMetrics(sceneLayout(31));
    assert.ok(big.widthUnits > small.widthUnits);
    assert.ok(big.stageHeight > small.stageHeight);
  });
});

describe("scenery", () => {
  it("keeps buildings in the campus strip, inside the ground and apart", () => {
    for (const days of [3, 24, 31]) {
      const l = sceneLayout(days);
      const { landmarks } = scenery(l);
      assert.ok(landmarks.length >= 1);
      for (const b of landmarks) {
        assert.ok(b.x + b.w <= CAMPUS_DEPTH || b.y + b.d <= CAMPUS_DEPTH, b.kind);
        assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= l.width && b.y + b.d <= l.height, b.kind);
        for (const other of landmarks) if (other !== b) assert.ok(!overlaps(b, other), `${b.kind} and ${other.kind}`);
      }
    }
  });

  it("keeps trees off the road and off the buildings", () => {
    const l = sceneLayout(24);
    const { landmarks, trees } = scenery(l);
    assert.ok(trees.length > 0);
    for (const t of trees) {
      assert.ok(!l.roads.some((r) => inside(t.x, t.y, r)));
      assert.ok(!landmarks.some((b) => inside(t.x, t.y, b)));
    }
  });
});

describe("towerFacets", () => {
  it("draws only the walls facing the camera, lit like the boxes", () => {
    const facets = towerFacets(0.5);
    assert.ok(facets.length > 0 && facets.length < 16);
    // The wall facing +y (turned 0) is in full light, the one facing +x (turned -90) as dark as a box's +x wall.
    assert.equal(facets.find((f) => f.turn === 0)?.shade, 1);
    assert.equal(facets.find((f) => f.turn === -90)?.shade, 0.74);
    // Walls facing away (-x, -y) are left out.
    assert.ok(!facets.some((f) => f.turn === 90 || f.turn === 180));
  });
});

describe("spots", () => {
  it("gives every pawn and every grave a spot", () => {
    for (let n = 1; n <= 6; n++) assert.equal(pawnSpots(n).spots.length, n);
    for (let n = 1; n <= 3; n++) assert.equal(graveSpots(n).spots.length, n);
  });
  it("keeps them on their own space", () => {
    for (let n = 1; n <= 6; n++) for (const s of pawnSpots(n).spots) assert.ok(Math.abs(s.dx) < 0.5 && Math.abs(s.dy) < 0.5);
  });
  it("stands gravestones on the coin, inside its rim", () => {
    // The coin is 0.82 across: its rim is 0.41 from the middle.
    for (let n = 1; n <= 3; n++) for (const s of graveSpots(n).spots) assert.ok(Math.hypot(s.dx, s.dy) < 0.3, `${n} graves`);
  });
});
