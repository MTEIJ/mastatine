import { createHash } from "node:crypto";
import { z } from "zod";

/** Pure scoreboard rules: no database, no React, so they are easy to test and safe to import anywhere. */

export const EDIT_MODES = ["anyone", "committee", "self"] as const;
export type EditMode = (typeof EDIT_MODES)[number];

export const EDIT_MODE_LABELS: Record<EditMode, { label: string; help: string }> = {
  anyone: { label: "Anyone with the link", help: "Everyone who has the link can change the score of anybody. Easiest, needs trust." },
  committee: { label: "Only the committee", help: "The public page is read-only. Committee members change scores from the activity page." },
  self: { label: "Everyone only their own", help: "Each player gets a personal link and can only change their own row." },
};

/** Looks of the full-screen page. Adding one means a block of tokens in scoreboard.css plus an entry here. */
export const THEMES = ["clean", "advent"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_LABELS: Record<Theme, { label: string; help: string }> = {
  clean: { label: "Clean", help: "A calm, compact overview. Follows light or dark mode." },
  advent: { label: "Advent", help: "A winter night with snow and gold, for the advent calendar." },
};

export const MAX_PLAYERS = 80;
/** Most changes (marks and un-marks together) one player can collect: keeps a runaway script from filling the table. */
export const MAX_MARKS = 1000;
export const MAX_NAME = 40;
export const SCORE_LIMIT = 10_000;

const score = z.number().int().min(-SCORE_LIMIT).max(SCORE_LIMIT);

export const scoreboardConfigSchema = z
  .object({
    title: z.string().trim().min(1).max(60),
    editMode: z.enum(EDIT_MODES),
    /** Everyone who subscribes (now and later) is added to the board automatically. */
    autoAddSubscribers: z.boolean().default(false),
    theme: z.enum(THEMES).default("clean"),
    /** What every player begins with. */
    startScore: score.default(0),
    /** A score cannot go below this. */
    minScore: score.default(0),
    /** A score cannot go above this; null means no limit. With a maximum the bars show progress towards it. */
    maxScore: score.nullable().default(null),
  })
  .refine((c) => c.minScore <= c.startScore && (c.maxScore === null || c.startScore <= c.maxScore), {
    message: "The start score must lie between the minimum and the maximum.",
  });
export type ScoreboardConfig = z.infer<typeof scoreboardConfigSchema>;

export const DEFAULT_CONFIG: ScoreboardConfig = {
  title: "Scoreboard",
  editMode: "anyone",
  autoAddSubscribers: false,
  theme: "clean",
  startScore: 0,
  minScore: 0,
  maxScore: null,
};

/** Settings from the database; anything malformed falls back to the defaults. */
export function parseConfig(raw: unknown): ScoreboardConfig {
  const parsed = scoreboardConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_CONFIG;
}

/** A number field of the settings form: blank means "not given" (undefined), anything unreadable becomes NaN so validation rejects it. */
export function numberField(raw: FormDataEntryValue | null): number | undefined {
  if (typeof raw !== "string" || raw.trim() === "") return undefined;
  return Number(raw);
}

export interface Limits {
  min: number;
  max: number | null;
}

/** Would a score of `current` stay within the limits after changing by `delta`? The database applies the same rule on write. */
export function canStep(current: number, delta: 1 | -1, { min, max }: Limits): boolean {
  const next = current + delta;
  return next >= min && (max === null || next <= max);
}

/** How far along the bar is, 0 to 100. With a maximum it is progress towards it; without, it is relative to the leader. */
export function barPercent(current: number, { min, max }: Limits, leader: number): number {
  const top = max ?? leader;
  if (top <= min) return 0;
  return Math.round(Math.min(1, Math.max(0, (current - min) / (top - min))) * 100);
}

export interface Who {
  /** A committee member of the activity (or admin), signed in. */
  isManager: boolean;
  /** The personal key from the player's own link, if one was given. */
  playerKey: string | null;
}

/** May this visitor change the score of this player? The server runs this on every write. */
export function canMark(mode: EditMode, who: Who, player: { editKey: string }): boolean {
  if (who.isManager) return true;
  if (mode === "anyone") return true;
  if (mode === "self") return who.playerKey !== null && timingSafeEqual(who.playerKey, player.editKey);
  return false;
}

/** Compares two secrets without leaking, through timing, how many leading characters matched. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** "Jasper de Vries" becomes "Jasper": only first names are shown on the public page. */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0]?.slice(0, MAX_NAME) ?? "";
}

/** A name typed by an organiser: trimmed, one line, length-capped. Null when nothing is left. */
export function cleanPlayerName(raw: string): string | null {
  const name = raw.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
  return name === "" ? null : name;
}

export interface PlayerRow {
  id: string;
  name: string;
  /** The player's score: the start score plus every +1 and -1. */
  marks: number;
}

/** Highest score first; ties keep alphabetical order. Returns a new array. */
export function rankPlayers<T extends PlayerRow>(players: readonly T[]): T[] {
  return [...players].sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name));
}

/** The grid like the old sheet: one column per player, as many rows as the highest score. */
export function gridRows(players: readonly PlayerRow[]): boolean[][] {
  const height = players.reduce((max, p) => Math.max(max, p.marks), 0);
  return Array.from({ length: height }, (_, row) => players.map((p) => row < p.marks));
}

/**
 * The player id of a subscriber: the same person on the same board always gets the same id, shaped like a UUID. That makes
 * adding them idempotent (two signups at once cannot create two rows) and keeps it removable like any other player.
 */
export function playerIdForUser(instanceId: string, userId: string): string {
  const h = createHash("sha256").update(`scoreboard:${instanceId}:${userId}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}
