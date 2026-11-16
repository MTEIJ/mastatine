"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPluginViewer } from "@/lib/plugin-access";
import { getInstance, getInstanceByToken } from "@/lib/plugin-instances";
import { createRateLimiter } from "@/lib/rate-limit";
import { cleanPlayerName, canMark, parseConfig } from "./logic";
import { addPlayer, changeScore, getPlayer, importSubscribers, removePlayer } from "./store";

const PLUGIN_ID = "scoreboard";

// Public endpoint: a generous cap per board, so one runaway script cannot flood it but a room full of people can play.
const markLimiter = createRateLimiter(240, 60 * 1000);

const uuid = z.uuid();

/**
 * +1 / -1 from the public page or the activity page. The token only says which board; whether this visitor may change
 * this player is decided again here (canMark), never taken from what the page happened to show.
 */
export async function markPlayer(formData: FormData): Promise<void> {
  const token = z.string().max(64).safeParse(formData.get("token"));
  const playerId = uuid.safeParse(formData.get("player"));
  const op = formData.get("op");
  if (!token.success || !playerId.success || (op !== "add" && op !== "sub")) return;

  const instance = await getInstanceByToken(token.data);
  if (!instance || instance.plugin_id !== PLUGIN_ID) return;

  const config = parseConfig(instance.config);
  const player = await getPlayer(instance.id, playerId.data);
  if (!player) return;

  const viewer = await getPluginViewer(instance.activity_id);
  const key = formData.get("key");
  const playerKey = typeof key === "string" && key !== "" ? key : null;
  if (!canMark(config.editMode, { isManager: viewer.isManager, playerKey }, player)) return;

  // Only attempts that are allowed count against the limit: a read-only link must not be able to use it up for everyone else.
  if (!markLimiter.allow(instance.id)) return;

  const by = viewer.isManager ? `committee:${viewer.userId}` : playerKey ? "self" : "link";
  await changeScore(instance.id, player.id, by, op === "add" ? 1 : -1, { start: config.startScore, min: config.minScore, max: config.maxScore });
  revalidatePath(`/p/${instance.public_token}`);
  revalidatePath(`/mastapps/activities/${instance.activity_id}`);
}

/** The instance behind a manager-only action, or null when it is not a scoreboard or the visitor is not a manager. */
async function managedBoard(formData: FormData) {
  const id = uuid.safeParse(formData.get("instance"));
  if (!id.success) return null;
  const instance = await getInstance(id.data);
  if (!instance || instance.plugin_id !== PLUGIN_ID) return null;
  const viewer = await getPluginViewer(instance.activity_id);
  return viewer.isManager ? { instance, by: `committee:${viewer.userId}` } : null;
}

function refreshBoard(instance: { activity_id: string; public_token: string }) {
  revalidatePath(`/p/${instance.public_token}`);
  revalidatePath(`/mastapps/activities/${instance.activity_id}`);
  revalidatePath(`/mastapps/activities/${instance.activity_id}/plugins`);
}

export async function addPlayerAction(formData: FormData): Promise<void> {
  const board = await managedBoard(formData);
  const name = cleanPlayerName(String(formData.get("name") ?? ""));
  if (!board || !name) return;
  await addPlayer(board.instance.id, name, board.by);
  refreshBoard(board.instance);
}

export async function removePlayerAction(formData: FormData): Promise<void> {
  const board = await managedBoard(formData);
  const playerId = uuid.safeParse(formData.get("player"));
  if (!board || !playerId.success) return;
  await removePlayer(board.instance.id, playerId.data);
  refreshBoard(board.instance);
}

export async function importSubscribersAction(formData: FormData): Promise<void> {
  const board = await managedBoard(formData);
  if (!board) return;
  await importSubscribers(board.instance.id, board.instance.activity_id, board.by);
  refreshBoard(board.instance);
}
