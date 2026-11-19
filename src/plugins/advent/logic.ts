import { z } from "zod";
import { EDIT_MODES } from "../scoreboard/logic";

/** Pure advent calendar rules: no database, no React, so they are easy to test and safe to import anywhere. */

export const MAX_DAYS = 31;
export const MAX_WALKERS = 80;
/** Tokens drawn on one tile before the rest collapses into "+n". */
export const MAX_TOKENS_PER_TILE = 6;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const MOVEMENTS = ["auto", "manual"] as const;
export type Movement = (typeof MOVEMENTS)[number];

export const adventConfigSchema = z.object({
  title: z.string().trim().min(1).max(60),
  /** How many days the calendar has. The map has a start tile plus one tile per day. */
  days: z.number().int().min(1).max(MAX_DAYS).default(24),
  /** Date of day 1, so the map can mark today. Optional. */
  startDate: isoDate.nullable().default(null),
  editMode: z.enum(EDIT_MODES),
  /** Everyone who subscribes (now and later) is added to the map automatically. */
  autoAddSubscribers: z.boolean().default(false),
  /**
   * "auto": everyone still in the game stands on today's day (from startDate); people only record who failed, and on
   * which day. "manual": players are stepped forward and back by hand.
   */
  movement: z.enum(MOVEMENTS).default("auto"),
});
export type AdventConfig = z.infer<typeof adventConfigSchema>;

export const DEFAULT_CONFIG: AdventConfig = {
  title: "Adtventcalendar",
  days: 24,
  startDate: null,
  editMode: "anyone",
  autoAddSubscribers: false,
  movement: "auto",
};

/** Settings from the database; anything malformed falls back to the defaults. */
export function parseConfig(raw: unknown): AdventConfig {
  const parsed = adventConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_CONFIG;
}

export interface Walker {
  id: string;
  name: string;
  /** The tile the walker stands on: 0 is the start, `days` is the finish. */
  day: number;
  /** The day the walker died, or null while alive. A dead walker stays where they fell. */
  diedOn: number | null;
  /** Address of their profile picture (an upload of ours), if they added one. */
  photo?: string | null;
}


/**
 * Keeping the map in sync with the sign-ups: the players that were added for someone who is no longer signed up.
 * Players added by hand (no userId) are never part of the sync.
 */
export function signedOffWalkers(rows: readonly { key: string; userId: string | null }[], participantIds: readonly string[]): string[] {
  const signedUp = new Set(participantIds);
  return rows.filter((row) => row.userId !== null && !signedUp.has(row.userId)).map((row) => row.key);
}

/** Only our own processed uploads count as a photo; anything else in the data is ignored rather than put in a page. */
const PHOTO_URL = /^\/uploads\/[a-z0-9-]+\.webp$/;

export function safePhoto(photo: string | null | undefined): string | null {
  return photo && PHOTO_URL.test(photo) ? photo : null;
}

/**
 * Who may set or remove a walker's photo: a committee member, the person themselves through their personal link, or
 * the signed-in account the walker belongs to. Stricter than moving: "anyone with the link" does not reach photos.
 */
export function canChangePhoto(
  viewer: { isManager: boolean; userId: string | null },
  holdsOwnKey: boolean,
  walker: { userId?: string | null },
): boolean {
  if (viewer.isManager || holdsOwnKey) return true;
  return viewer.userId !== null && walker.userId != null && walker.userId === viewer.userId;
}

/** Can this walker take a step of `delta` on a calendar of `days` days? The database applies the same rule on write. */
export function canMove(walker: Pick<Walker, "day" | "diedOn">, delta: 1 | -1, days: number): boolean {
  if (walker.diedOn !== null) return false;
  const next = walker.day + delta;
  return next >= 0 && next <= days;
}

export interface Tile {
  day: number;
  /** Alive walkers standing here. */
  walkers: Walker[];
  /** Walkers who died here. */
  graves: Walker[];
}

/** One tile per day from 0 (start) to `days` (finish), each with who stands or fell on it. Players sorted by name. */
export function buildTiles(walkers: readonly Walker[], days: number): Tile[] {
  const byName = [...walkers].sort((a, b) => a.name.localeCompare(b.name));
  return Array.from({ length: days + 1 }, (_, day) => ({
    day,
    walkers: byName.filter((w) => w.diedOn === null && w.day === day),
    graves: byName.filter((w) => w.diedOn === day),
  }));
}

/** The day number for an ISO date (today), counting the start date as day 1. Null before the start, after the end, or without a start date. */
export function currentDay(startDate: string | null, today: string, days: number): number | null {
  if (!startDate) return null;
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
  return Number.isFinite(diff) && diff >= 1 && diff <= days ? diff : null;
}

/**
 * How far the calendar has got, for automatic movement: 0 before day 1 (or without a date), the day number while it
 * runs, and the last day once it is over.
 */
export function progressDay(startDate: string | null, today: string, days: number): number {
  if (!startDate) return 0;
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) / 86_400_000) + 1;
  if (!Number.isFinite(diff) || diff < 1) return 0;
  return Math.min(diff, days);
}

/**
 * Where everyone stands. With automatic movement the stored day is ignored: the living are on the current day and the
 * fallen on the day they fell. With manual movement the stored day counts.
 */
export function placeWalkers<T extends Walker>(walkers: readonly T[], config: Pick<AdventConfig, "movement">, progress: number): T[] {
  if (config.movement === "manual") return [...walkers];
  return walkers.map((w) => ({ ...w, day: w.diedOn ?? progress }));
}

/**
 * The last day someone can be marked as failed on: with automatic movement any day up to today, with manual movement
 * any day up to where they stand. Never a day that has not happened yet; 0 means not possible yet.
 */
export function lastFailDay(walker: Pick<Walker, "day">, config: Pick<AdventConfig, "movement">, progress: number): number {
  return config.movement === "auto" ? progress : walker.day;
}

/** Can this walker be marked as failed on this day? Alive, and the day is between day 1 and lastFailDay. */
export function canFailOn(walker: Pick<Walker, "day" | "diedOn">, day: number, config: Pick<AdventConfig, "movement">, progress: number): boolean {
  return walker.diedOn === null && Number.isInteger(day) && day >= 1 && day <= lastFailDay(walker, config, progress);
}

/** Up to two letters for a token: "Jasper" becomes "Ja". */
export function initials(name: string): string {
  const letters = Array.from(name.trim()).slice(0, 2).join("");
  return letters.charAt(0).toLocaleUpperCase() + letters.slice(1).toLocaleLowerCase();
}

/** A stable colour (hue 0-359) per walker, so a token looks the same on every visit. */
export function tokenHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash % 360;
}

/** The walkers in leaderboard order for the list below the map: furthest first, the fallen last. */
export function standings<T extends Walker>(walkers: readonly T[]): T[] {
  return [...walkers].sort((a, b) => Number(a.diedOn !== null) - Number(b.diedOn !== null) || b.day - a.day || a.name.localeCompare(b.name));
}
