import { createHash } from "node:crypto";
import { z } from "zod";

/** Pure scoreboard rules: no database, no React, so they are easy to test and safe to import anywhere. */

export const EDIT_MODES = ["anyone", "committee", "self"] as const;
export type EditMode = (typeof EDIT_MODES)[number];

export const EDIT_MODE_LABELS: Record<EditMode, { label: string; help: string }> = {
  anyone: { label: "Anyone with the link", help: "Everyone who has the link can add or undo a mark for anybody. Easiest, needs trust." },
  committee: { label: "Only the committee", help: "The public page is read-only. Committee members add marks from the activity page." },
  self: { label: "Everyone only their own", help: "Each player gets a personal link and can only change their own row." },
};

export const MAX_PLAYERS = 80;
export const MAX_MARKS = 1000;
export const MAX_NAME = 40;

export const scoreboardConfigSchema = z.object({
  title: z.string().trim().min(1).max(60),
  editMode: z.enum(EDIT_MODES),
  /** Everyone who subscribes to the activity (now and later) is added to the board automatically. */
  autoAddSubscribers: z.boolean().default(false),
});
export type ScoreboardConfig = z.infer<typeof scoreboardConfigSchema>;

export const DEFAULT_CONFIG: ScoreboardConfig = { title: "Scoreboard", editMode: "anyone", autoAddSubscribers: false };

/** Settings from the database; anything malformed falls back to the defaults. */
export function parseConfig(raw: unknown): ScoreboardConfig {
  const parsed = scoreboardConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : DEFAULT_CONFIG;
}

export interface Who {
  /** A committee member of the activity (or admin), signed in. */
  isManager: boolean;
  /** The personal key from the player's own link, if one was given. */
  playerKey: string | null;
}

/** May this visitor add or undo a mark for this player? The server runs this on every write. */
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
  marks: number;
}

/** Highest score first; ties keep alphabetical order. Returns a new array. */
export function rankPlayers<T extends PlayerRow>(players: readonly T[]): T[] {
  return [...players].sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name));
}

/** The grid like last year's sheet: one column per player, as many rows as the highest score. */
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
