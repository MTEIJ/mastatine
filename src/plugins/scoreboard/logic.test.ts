import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { barPercent, canMark, canStep, cleanPlayerName, firstName, gridRows, numberField, parseConfig, playerIdForUser, rankPlayers, timingSafeEqual } from "./logic";

const DEFAULTS = { title: "Scoreboard", editMode: "anyone", autoAddSubscribers: false, theme: "clean", startScore: 0, minScore: 0, maxScore: null };

const player = { editKey: "secret-key" };
const nobody = { isManager: false, playerKey: null };

describe("canMark", () => {
  it("lets anyone mark in 'anyone' mode", () => {
    assert.equal(canMark("anyone", nobody, player), true);
  });

  it("keeps the public read-only in 'committee' mode, but not managers", () => {
    assert.equal(canMark("committee", nobody, player), false);
    assert.equal(canMark("committee", { isManager: false, playerKey: "secret-key" }, player), false);
    assert.equal(canMark("committee", { isManager: true, playerKey: null }, player), true);
  });

  it("needs the player's own key in 'self' mode", () => {
    assert.equal(canMark("self", nobody, player), false);
    assert.equal(canMark("self", { isManager: false, playerKey: "wrong" }, player), false);
    assert.equal(canMark("self", { isManager: false, playerKey: "secret-key" }, player), true);
    assert.equal(canMark("self", { isManager: true, playerKey: null }, player), true);
  });
});

describe("timingSafeEqual", () => {
  it("is true only for identical strings", () => {
    assert.equal(timingSafeEqual("abc", "abc"), true);
    assert.equal(timingSafeEqual("abc", "abd"), false);
    assert.equal(timingSafeEqual("abc", "abcd"), false);
    assert.equal(timingSafeEqual("", ""), true);
  });
});

describe("parseConfig", () => {
  it("accepts a valid config", () => {
    assert.deepEqual(parseConfig({ title: " Advent ", editMode: "self" }), { ...DEFAULTS, title: "Advent", editMode: "self" });
  });

  it("reads the auto-add option, and treats it as off for boards saved before it existed", () => {
    assert.equal(parseConfig({ title: "A", editMode: "anyone", autoAddSubscribers: true }).autoAddSubscribers, true);
    assert.equal(parseConfig({ title: "A", editMode: "anyone" }).autoAddSubscribers, false);
  });

  it("reads theme and score limits, with the clean theme and no maximum as defaults", () => {
    const c = parseConfig({ title: "A", editMode: "anyone", theme: "advent", startScore: 5, minScore: 0, maxScore: 24 });
    assert.deepEqual([c.theme, c.startScore, c.minScore, c.maxScore], ["advent", 5, 0, 24]);
    assert.deepEqual([parseConfig({ title: "A", editMode: "anyone" }).theme, parseConfig({ title: "A", editMode: "anyone" }).maxScore], ["clean", null]);
  });

  it("rejects a start score outside the minimum and maximum, an unknown theme and non-whole scores", () => {
    const base = { title: "A", editMode: "anyone" };
    for (const bad of [
      { ...base, startScore: 30, maxScore: 24 },
      { ...base, startScore: -1, minScore: 0 },
      { ...base, minScore: 5, startScore: 0 },
      { ...base, theme: "neon" },
      { ...base, startScore: 1.5 },
      { ...base, maxScore: 100000 },
    ]) {
      assert.deepEqual(parseConfig(bad), DEFAULTS);
    }
  });

  it("falls back to the defaults for anything malformed", () => {
    for (const bad of [null, {}, { title: "", editMode: "anyone" }, { title: "x", editMode: "root" }, "nope", { title: "x".repeat(61), editMode: "anyone" }]) {
      assert.deepEqual(parseConfig(bad), DEFAULTS);
    }
  });
});

describe("names", () => {
  it("shows first names only", () => {
    assert.equal(firstName("  Jasper de Vries "), "Jasper");
    assert.equal(firstName(""), "");
  });

  it("cleans typed names", () => {
    assert.equal(cleanPlayerName("  Harm \n  Jan "), "Harm Jan");
    assert.equal(cleanPlayerName("   "), null);
    assert.equal(cleanPlayerName("x".repeat(100))?.length, 40);
  });
});

describe("ranking and grid", () => {
  const players = [
    { id: "1", name: "Koen", marks: 2 },
    { id: "2", name: "Daan", marks: 5 },
    { id: "3", name: "Chris", marks: 2 },
  ];

  it("ranks by marks, ties alphabetically, without mutating the input", () => {
    assert.deepEqual(rankPlayers(players).map((p) => p.name), ["Daan", "Chris", "Koen"]);
    assert.equal(players[0].name, "Koen");
  });

  it("builds a grid as tall as the highest score", () => {
    const grid = gridRows(players);
    assert.equal(grid.length, 5);
    assert.deepEqual(grid[0], [true, true, true]);
    assert.deepEqual(grid[2], [false, true, false]);
  });

  it("is empty when nobody scored", () => {
    assert.deepEqual(gridRows([{ id: "1", name: "A", marks: 0 }]), []);
  });
});

describe("playerIdForUser", () => {
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

  it("is a stable UUID per person and board", () => {
    const id = playerIdForUser("board-1", "user-1");
    assert.match(id, uuid);
    assert.equal(playerIdForUser("board-1", "user-1"), id);
  });

  it("differs between people and between boards", () => {
    assert.notEqual(playerIdForUser("board-1", "user-1"), playerIdForUser("board-1", "user-2"));
    assert.notEqual(playerIdForUser("board-1", "user-1"), playerIdForUser("board-2", "user-1"));
  });
});

describe("canStep", () => {
  const limits = { min: 0, max: 24 };

  it("allows steps inside the range and blocks the edges", () => {
    assert.equal(canStep(5, 1, limits), true);
    assert.equal(canStep(5, -1, limits), true);
    assert.equal(canStep(24, 1, limits), false);
    assert.equal(canStep(0, -1, limits), false);
    assert.equal(canStep(23, 1, limits), true);
    assert.equal(canStep(1, -1, limits), true);
  });

  it("has no top without a maximum, and allows negative scores when the minimum is negative", () => {
    assert.equal(canStep(9999, 1, { min: 0, max: null }), true);
    assert.equal(canStep(-3, -1, { min: -5, max: null }), true);
    assert.equal(canStep(-5, -1, { min: -5, max: null }), false);
  });
});

describe("barPercent", () => {
  it("shows progress towards the maximum", () => {
    assert.equal(barPercent(6, { min: 0, max: 24 }, 8), 25);
    assert.equal(barPercent(24, { min: 0, max: 24 }, 24), 100);
    assert.equal(barPercent(0, { min: 0, max: 24 }, 8), 0);
  });

  it("measures from the minimum", () => {
    assert.equal(barPercent(0, { min: -10, max: 10 }, 5), 50);
  });

  it("is relative to the leader without a maximum", () => {
    assert.equal(barPercent(4, { min: 0, max: null }, 8), 50);
    assert.equal(barPercent(8, { min: 0, max: null }, 8), 100);
  });

  it("never leaves 0..100, and is 0 when there is no range", () => {
    assert.equal(barPercent(50, { min: 0, max: 10 }, 50), 100);
    assert.equal(barPercent(-5, { min: 0, max: 10 }, 5), 0);
    assert.equal(barPercent(3, { min: 5, max: 5 }, 3), 0);
  });
});

describe("numberField", () => {
  it("reads numbers, treats blank as not given and keeps junk invalid", () => {
    assert.equal(numberField("12"), 12);
    assert.equal(numberField("-3"), -3);
    assert.equal(numberField(""), undefined);
    assert.equal(numberField("  "), undefined);
    assert.equal(numberField(null), undefined);
    assert.ok(Number.isNaN(numberField("abc")));
  });
});
