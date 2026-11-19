import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseBoardApplication, roleTitle } from "./board-application";

function form(overrides: Record<string, string> = {}): FormData {
  const data = new FormData();
  const base: Record<string, string> = {
    first_choice: "chair",
    second_choice: "",
    motivation: "I have loved masts since I was a small antenna myself.",
    study: "Data Science, year 2",
    hours_per_week: "4-8",
    mast_location: "Behind the Randwyck station",
    mast_spirit: "guyed",
    crate_hours: "6",
    superpower: "Can smell 5G",
    promise: "on",
  };
  for (const [key, value] of Object.entries({ ...base, ...overrides })) data.set(key, value);
  return data;
}

describe("parseBoardApplication", () => {
  it("accepts a complete form and treats an empty second choice as none", () => {
    const result = parseBoardApplication(form());
    assert.ok(result.ok);
    assert.equal(result.data.first_choice, "chair");
    assert.equal(result.data.second_choice, null);
    assert.equal(result.data.crate_hours, 6);
  });

  it("keeps a second choice that differs from the first", () => {
    const result = parseBoardApplication(form({ second_choice: "awareness" }));
    assert.ok(result.ok);
    assert.equal(result.data.second_choice, "awareness");
  });

  it("refuses a second choice equal to the first", () => {
    const result = parseBoardApplication(form({ second_choice: "chair" }));
    assert.equal(result.ok, false);
  });

  it("refuses roles, hours and mast spirits that are not on the list", () => {
    const cases: Record<string, string>[] = [{ first_choice: "king" }, { hours_per_week: "40" }, { mast_spirit: "eiffel" }];
    for (const bad of cases) {
      assert.equal(parseBoardApplication(form(bad)).ok, false, JSON.stringify(bad));
    }
  });

  it("requires the promise and a real motivation", () => {
    const noPromise = form();
    noPromise.delete("promise");
    assert.equal(parseBoardApplication(noPromise).ok, false);
    assert.equal(parseBoardApplication(form({ motivation: "pls" })).ok, false);
  });

  it("keeps crate hours within a humane range", () => {
    assert.equal(parseBoardApplication(form({ crate_hours: "73" })).ok, false);
    assert.equal(parseBoardApplication(form({ crate_hours: "-1" })).ok, false);
    assert.equal(parseBoardApplication(form({ crate_hours: "2.5" })).ok, false);
  });
});

describe("roleTitle", () => {
  it("names known roles and passes unknown keys through", () => {
    assert.equal(roleTitle("treasurer"), "Moneymaster");
    assert.equal(roleTitle("gone"), "gone");
  });
});
