import { describe, expect, test } from "bun:test";
import { formatDays, formatWhen } from "@/lib/datetime";

// Winter dates in Europe/Amsterdam (UTC+1), so 19:00Z is 20:00 local.
const at = (iso: string) => new Date(iso);

describe("formatWhen", () => {
  test("shows only the start without an end", () => {
    expect(formatWhen(at("2026-11-12T19:00:00Z"), null)).toBe("12 November · 20:00");
  });

  test("shows the end time when it ends the same day", () => {
    expect(formatWhen(at("2026-11-12T19:00:00Z"), at("2026-11-12T22:00:00Z"))).toBe("12 November · 20:00 – 23:00");
  });

  test("shows both days when it runs over several days", () => {
    expect(formatWhen(at("2026-11-12T19:00:00Z"), at("2026-11-14T17:00:00Z"))).toBe("12 Nov 20:00 – 14 Nov 18:00");
  });

  test("an end that is not after the start is ignored", () => {
    expect(formatWhen(at("2026-11-12T19:00:00Z"), at("2026-11-12T19:00:00Z"))).toBe("12 November · 20:00");
  });

  test("an end after midnight local time counts as another day", () => {
    expect(formatWhen(at("2026-11-12T21:00:00Z"), at("2026-11-12T23:30:00Z"))).toBe("12 Nov 22:00 – 13 Nov 00:30");
  });
});

describe("formatDays", () => {
  test("a single day", () => {
    expect(formatDays(at("2026-11-12T19:00:00Z"), null)).toBe("12 November 2026");
  });

  test("several days in one month", () => {
    expect(formatDays(at("2026-11-12T19:00:00Z"), at("2026-11-14T17:00:00Z"))).toBe("12 – 14 Nov 2026");
  });

  test("several days across months", () => {
    expect(formatDays(at("2026-10-30T19:00:00Z"), at("2026-11-02T17:00:00Z"))).toBe("30 Oct – 2 Nov 2026");
  });
});
