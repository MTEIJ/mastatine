import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { UPLOAD_DIR, UPLOAD_FILENAME_RE, sniffImageExt } from "@/lib/uploads";
import { safePhoto } from "./logic";

/** What we accept from the browser. Phone photos fit; anything bigger is refused before decoding. */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
/** What we keep: a small square, a few kilobytes. 256 px is twice the biggest size a pawn is drawn at. */
const SIDE = 256;

export type PhotoResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Turns an uploaded file into a profile picture: checks it really is an image (by its bytes, not its name), crops it
 * to a square around the most interesting part, drops all metadata (GPS included) and the animation, and stores a
 * small WebP. The original is never written to disk.
 */
export async function storePhoto(file: File): Promise<PhotoResult> {
  if (file.size === 0) return { ok: false, error: "That file is empty." };
  if (file.size > MAX_PHOTO_BYTES) return { ok: false, error: "That photo is too big (max 10 MB)." };
  const input = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageExt(input)) return { ok: false, error: "Use a JPG, PNG, WebP or GIF image." };

  let output: Buffer;
  try {
    output = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize(SIDE, SIDE, { fit: "cover", position: sharp.strategy.attention })
      .webp({ quality: 78 })
      .toBuffer();
  } catch {
    return { ok: false, error: "That image could not be read." };
  }

  const filename = `advent-${randomUUID()}.webp`;
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, filename), output);
  } catch (error) {
    console.error("Failed to store an advent photo:", error);
    return { ok: false, error: "The photo could not be saved. Try again later." };
  }
  return { ok: true, url: `/uploads/${filename}` };
}

/** Deletes a photo we stored earlier. Anything that is not one of our upload addresses is ignored. */
export async function deletePhoto(url: string | null): Promise<void> {
  const safe = safePhoto(url);
  if (!safe) return;
  const filename = safe.slice("/uploads/".length);
  if (!UPLOAD_FILENAME_RE.test(filename)) return;
  await unlink(path.join(UPLOAD_DIR, filename)).catch(() => undefined);
}
