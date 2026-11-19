"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getPluginViewer } from "@/lib/plugin-access";
import { todayInAmsterdam } from "./today";
import { getInstance, getInstanceByToken } from "@/lib/plugin-instances";
import { createRateLimiter } from "@/lib/rate-limit";
import { canMark, cleanPlayerName, timingSafeEqual } from "../scoreboard/logic";
import { canChangePhoto, canFailOn, canMove, parseConfig, progressDay } from "./logic";
import { deletePhoto, storePhoto } from "./photos";
import { addWalker, getWalker, importSubscribers, killWalker, removeWalker, reviveWalker, setWalkerPhoto, stepWalker } from "./store";

const PLUGIN_ID = "advent-calendar";

// Public endpoint: a generous cap per calendar, so one runaway script cannot flood it but a room full of people can play.
const moveLimiter = createRateLimiter(240, 60 * 1000);
// Photos cost disk and processing: a few per person per calendar per hour, and a ceiling for the whole site per day.
const photoLimiter = createRateLimiter(40, 60 * 60 * 1000);
const sitePhotoLimiter = createRateLimiter(400, 24 * 60 * 60 * 1000);

const uuid = z.uuid();

function refresh(instance: { activity_id: string; public_token: string }) {
  revalidatePath(`/p/${instance.public_token}`);
  revalidatePath(`/mastapps/activities/${instance.activity_id}`);
  revalidatePath(`/mastapps/activities/${instance.activity_id}/plugins`, "layout");
}

/**
 * Forward, back or "died" from the public page or the activity page. The token only says which calendar; whether this
 * visitor may move this walker is decided again here (canMark), never taken from what the page happened to show.
 * Bringing someone back to life is for the committee only.
 */
export async function moveWalker(formData: FormData): Promise<void> {
  const token = z.string().max(64).safeParse(formData.get("token"));
  const walkerId = uuid.safeParse(formData.get("walker"));
  const op = formData.get("op");
  if (!token.success || !walkerId.success || (op !== "fwd" && op !== "back" && op !== "die" && op !== "revive")) return;

  const instance = await getInstanceByToken(token.data);
  if (!instance || instance.plugin_id !== PLUGIN_ID) return;

  const config = parseConfig(instance.config);
  const walker = await getWalker(instance.id, walkerId.data);
  if (!walker) return;

  const viewer = await getPluginViewer(instance.activity_id);
  const key = formData.get("key");
  const playerKey = typeof key === "string" && key !== "" ? key : null;
  const may = op === "revive" ? viewer.isManager : canMark(config.editMode, { isManager: viewer.isManager, playerKey }, walker);
  if (!may) return;

  // Only attempts that are allowed count against the limit: a read-only link must not be able to use it up for everyone else.
  if (!moveLimiter.allow(instance.id)) return;

  if (op === "fwd" || op === "back") {
    // With automatic movement nobody is stepped by hand.
    const delta = op === "fwd" ? 1 : -1;
    if (config.movement === "manual" && canMove(walker, delta, config.days)) await stepWalker(instance.id, walker.id, delta, config.days);
  } else if (op === "die") {
    // The day they failed: chosen in the list, never a day that has not happened yet.
    const day = Number(formData.get("day"));
    const progress = progressDay(config.startDate, todayInAmsterdam(), config.days);
    if (canFailOn(walker, day, config, progress)) await killWalker(instance.id, walker.id, day);
  } else {
    await reviveWalker(instance.id, walker.id);
  }
  refresh(instance);
}

export interface PhotoState {
  error: string | null;
}

/**
 * Sets or removes a walker's profile picture. Allowed for the committee, for the person through their personal link
 * and for the account the walker belongs to (canChangePhoto); never for "anyone with the link". Every walker has at
 * most one photo: the file it replaces is deleted.
 */
export async function changeWalkerPhoto(formData: FormData): Promise<PhotoState> {
  const token = z.string().max(64).safeParse(formData.get("token"));
  const walkerId = uuid.safeParse(formData.get("walker"));
  const remove = formData.get("op") === "remove";
  const file = formData.get("photo");
  const denied = { error: "You can't change this photo." };
  if (!token.success || !walkerId.success) return denied;
  if (!remove && !(file instanceof File)) return { error: "Choose a photo first." };

  const instance = await getInstanceByToken(token.data);
  if (!instance || instance.plugin_id !== PLUGIN_ID) return denied;
  const walker = await getWalker(instance.id, walkerId.data);
  if (!walker) return denied;

  const viewer = await getPluginViewer(instance.activity_id);
  const key = formData.get("key");
  const holdsOwnKey = typeof key === "string" && key !== "" && timingSafeEqual(key, walker.editKey);
  if (!canChangePhoto(viewer, holdsOwnKey, walker)) return denied;

  let url: string | null = null;
  if (!remove) {
    if (!photoLimiter.allow(instance.id) || !sitePhotoLimiter.allow("all")) return { error: "Too many photos at once. Try again later." };
    const stored = await storePhoto(file as File);
    if (!stored.ok) return { error: stored.error };
    url = stored.url;
  }

  const { found, old } = await setWalkerPhoto(instance.id, walker.id, url);
  // Removed in the meantime: the new file belongs to nobody.
  await deletePhoto(found ? old : url);
  refresh(instance);
  return { error: null };
}

/** The instance behind a manager-only action, or null when it is not an advent calendar or the visitor is not a manager. */
async function managedCalendar(formData: FormData) {
  const id = uuid.safeParse(formData.get("instance"));
  if (!id.success) return null;
  const instance = await getInstance(id.data);
  if (!instance || instance.plugin_id !== PLUGIN_ID) return null;
  const viewer = await getPluginViewer(instance.activity_id);
  return viewer.isManager ? { instance, by: `committee:${viewer.userId}` } : null;
}

export async function addWalkerAction(formData: FormData): Promise<void> {
  const calendar = await managedCalendar(formData);
  const name = cleanPlayerName(String(formData.get("name") ?? ""));
  if (!calendar || !name) return;
  await addWalker(calendar.instance.id, name, calendar.by);
  refresh(calendar.instance);
}

export async function removeWalkerAction(formData: FormData): Promise<void> {
  const calendar = await managedCalendar(formData);
  const walkerId = uuid.safeParse(formData.get("walker"));
  if (!calendar || !walkerId.success) return;
  await deletePhoto(await removeWalker(calendar.instance.id, walkerId.data));
  refresh(calendar.instance);
}

export async function importSubscribersAction(formData: FormData): Promise<void> {
  const calendar = await managedCalendar(formData);
  if (!calendar) return;
  await importSubscribers(calendar.instance.id, calendar.instance.activity_id, calendar.by);
  refresh(calendar.instance);
}
