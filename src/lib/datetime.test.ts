import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatDays, formatWhen } from "@/lib/datetime";

// Winter dates in Europe/Amsterdam (UTC+1), so 19:00Z is 20:00 local.
const at = (iso: string) => new Date(iso);

describe("formatWhen", () => {
  it("shows only the start without an end", () => {
    assert.equal(formatWhen(at("2026-11-12T19:00:00Z"), null), "12 November · 20:00");
  });

  it("shows the end time when it ends the same day", () => {
    assert.equal(formatWhen(at("2026-11-12T19:00:00Z"), at("2026-11-12T22:00:00Z")), "12 November · 20:00 – 23:00");
  });

  it("shows both days when it runs over several days", () => {
    assert.equal(formatWhen(at("2026-11-12T19:00:00Z"), at("2026-11-14T17:00:00Z")), "12 Nov 20:00 – 14 Nov 18:00");
  });

  it("an end that is not after the start is ignored", () => {
    assert.equal(formatWhen(at("2026-11-12T19:00:00Z"), at("2026-11-12T19:00:00Z")), "12 November · 20:00");
  });

  it("an end after midnight local time counts as another day", () => {
    assert.equal(formatWhen(at("2026-11-12T21:00:00Z"), at("2026-11-12T23:30:00Z")), "12 Nov 22:00 – 13 Nov 00:30");
  });
});

describe("formatDays", () => {
  it("a single day", () => {
    assert.equal(formatDays(at("2026-11-12T19:00:00Z"), null), "12 November 2026");
  });

  it("several days in one month", () => {
    assert.equal(formatDays(at("2026-11-12T19:00:00Z"), at("2026-11-14T17:00:00Z")), "12 – 14 Nov 2026");
  });

  it("several days across months", () => {
    assert.equal(formatDays(at("2026-10-30T19:00:00Z"), at("2026-11-02T17:00:00Z")), "30 Oct – 2 Nov 2026");
  });
});
