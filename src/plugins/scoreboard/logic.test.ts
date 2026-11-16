import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canMark, cleanPlayerName, firstName, gridRows, parseConfig, playerIdForUser, rankPlayers, timingSafeEqual } from "./logic";

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
    assert.deepEqual(parseConfig({ title: " Advent ", editMode: "self" }), { title: "Advent", editMode: "self", autoAddSubscribers: false });
  });

  it("reads the auto-add option, and treats it as off for boards saved before it existed", () => {
    assert.equal(parseConfig({ title: "A", editMode: "anyone", autoAddSubscribers: true }).autoAddSubscribers, true);
    assert.equal(parseConfig({ title: "A", editMode: "anyone" }).autoAddSubscribers, false);
  });

  it("falls back to the defaults for anything malformed", () => {
    for (const bad of [null, {}, { title: "", editMode: "anyone" }, { title: "x", editMode: "root" }, "nope", { title: "x".repeat(61), editMode: "anyone" }]) {
      assert.deepEqual(parseConfig(bad), { title: "Scoreboard", editMode: "anyone", autoAddSubscribers: false });
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
