import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildTiles, canChangePhoto, canFailOn, canMove, lastFailDay, placeWalkers, progressDay, currentDay, initials, parseConfig, safePhoto, standings, tokenHue } from "./logic";

const walker = (id: string, name: string, day: number, diedOn: number | null = null) => ({ id, name, day, diedOn });

describe("advent config", () => {
  it("falls back to the defaults for rubbish", () => {
    assert.equal(parseConfig({ days: 99 }).days, 24);
    assert.equal(parseConfig(null).title, "Adtventcalendar");
  });
  it("accepts a valid config", () => {
    const c = parseConfig({ title: "X", days: 12, startDate: "2026-12-01", editMode: "self", autoAddSubscribers: true });
    assert.equal(c.days, 12);
    assert.equal(c.startDate, "2026-12-01");
  });
});

describe("canMove / canFailOn", () => {
  const auto = { movement: "auto" as const };
  const manual = { movement: "manual" as const };
  it("stays on the board", () => {
    assert.equal(canMove(walker("a", "A", 0), -1, 24), false);
    assert.equal(canMove(walker("a", "A", 24), 1, 24), false);
    assert.equal(canMove(walker("a", "A", 5), 1, 24), true);
  });
  it("the dead do not move or fail twice", () => {
    const dead = walker("a", "A", 5, 5);
    assert.equal(canMove(dead, 1, 24), false);
    assert.equal(canMove(dead, -1, 24), false);
    assert.equal(canFailOn(dead, 3, auto, 9), false);
  });
  it("automatic: any day that has happened, never a future one", () => {
    const w = walker("a", "A", 0);
    assert.equal(canFailOn(w, 9, auto, 9), true);
    assert.equal(canFailOn(w, 1, auto, 9), true);
    assert.equal(canFailOn(w, 10, auto, 9), false);
    assert.equal(canFailOn(w, 0, auto, 9), false);
    assert.equal(canFailOn(w, 2.5, auto, 9), false);
    assert.equal(canFailOn(w, Number.NaN, auto, 9), false);
    // Before day 1 nobody can fail yet.
    assert.equal(lastFailDay(w, auto, 0), 0);
  });
  it("by hand: up to the day they stand on", () => {
    assert.equal(canFailOn(walker("a", "A", 5), 5, manual, 9), true);
    assert.equal(canFailOn(walker("a", "A", 5), 6, manual, 9), false);
  });
});

describe("automatic movement", () => {
  it("follows the calendar: start before day 1, today while it runs, the finish after", () => {
    assert.equal(progressDay(null, "2026-12-05", 24), 0);
    assert.equal(progressDay("2026-12-01", "2026-11-30", 24), 0);
    assert.equal(progressDay("2026-12-01", "2026-12-01", 24), 1);
    assert.equal(progressDay("2026-12-01", "2026-12-09", 24), 9);
    assert.equal(progressDay("2026-12-01", "2027-01-10", 24), 24);
  });
  it("puts the living on today and the fallen where they fell", () => {
    const placed = placeWalkers([walker("a", "A", 2), walker("b", "B", 7, 4)], { movement: "auto" }, 9);
    assert.deepEqual(placed.map((w) => w.day), [9, 4]);
    // By hand, the stored day counts.
    assert.deepEqual(placeWalkers([walker("a", "A", 2)], { movement: "manual" }, 9).map((w) => w.day), [2]);
  });
});

describe("buildTiles", () => {
  it("puts walkers and graves on the right tile", () => {
    const tiles = buildTiles([walker("a", "Ann", 3), walker("b", "Bo", 3), walker("c", "Cy", 7, 7), walker("d", "Di", 0)], 24);
    assert.equal(tiles.length, 25);
    assert.deepEqual(tiles[3].walkers.map((w) => w.name), ["Ann", "Bo"]);
    assert.deepEqual(tiles[7].graves.map((w) => w.name), ["Cy"]);
    assert.equal(tiles[7].walkers.length, 0);
    assert.equal(tiles[0].walkers[0].name, "Di");
  });
});

describe("currentDay", () => {
  it("counts the start date as day 1", () => {
    assert.equal(currentDay("2026-12-01", "2026-12-01", 24), 1);
    assert.equal(currentDay("2026-12-01", "2026-12-24", 24), 24);
  });
  it("is null outside the calendar or without a start date", () => {
    assert.equal(currentDay("2026-12-01", "2026-11-30", 24), null);
    assert.equal(currentDay("2026-12-01", "2026-12-25", 24), null);
    assert.equal(currentDay(null, "2026-12-05", 24), null);
  });
});

describe("tokens", () => {
  it("makes initials", () => {
    assert.equal(initials("jasper"), "Ja");
    assert.equal(initials("Q"), "Q");
  });
  it("gives a stable hue", () => {
    assert.equal(tokenHue("abc"), tokenHue("abc"));
    assert.ok(tokenHue("abc") >= 0 && tokenHue("abc") < 360);
  });
});

describe("standings", () => {
  it("ranks the furthest first and the fallen last", () => {
    const names = standings([walker("a", "A", 2), walker("b", "B", 9, 9), walker("c", "C", 5)]).map((w) => w.name);
    assert.deepEqual(names, ["C", "A", "B"]);
  });
});

describe("photos", () => {
  it("only accepts our own processed uploads", () => {
    assert.equal(safePhoto("/uploads/advent-1a2b.webp"), "/uploads/advent-1a2b.webp");
    assert.equal(safePhoto("https://evil.example/x.webp"), null);
    assert.equal(safePhoto("/uploads/x.webp\") url(evil"), null);
    assert.equal(safePhoto("/uploads/x.png"), null);
    assert.equal(safePhoto(null), null);
  });
  it("lets managers, the key holder and the own account change a photo, nobody else", () => {
    const anon = { isManager: false, userId: null };
    assert.equal(canChangePhoto({ isManager: true, userId: "m" }, false, {}), true);
    assert.equal(canChangePhoto(anon, true, {}), true);
    assert.equal(canChangePhoto({ isManager: false, userId: "u1" }, false, { userId: "u1" }), true);
    assert.equal(canChangePhoto({ isManager: false, userId: "u1" }, false, { userId: "u2" }), false);
    assert.equal(canChangePhoto(anon, false, { userId: null }), false);
    assert.equal(canChangePhoto({ isManager: false, userId: "u1" }, false, { userId: null }), false);
  });
});

