import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR, encodeWebp, sniffImageExt } from "@/lib/uploads";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/**
 * Validates, re-encodes (metadata stripped) and stores an image sent with a form. Returns its /uploads URL, or an
 * error message for the form. `noun` names the image in those messages, e.g. "The poster".
 */
export async function storeFormImage(file: File, noun: string): Promise<{ url: string } | { error: string }> {
  if (file.size > MAX_IMAGE_BYTES) return { error: `${noun} is too large (max 10 MB).` };
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffImageExt(bytes)) return { error: `${noun} must be a JPG, PNG, WebP or GIF image.` };

  let webp: Buffer;
  try {
    webp = await encodeWebp(bytes);
  } catch {
    return { error: `${noun} could not be read as an image.` };
  }

  const filename = `${Date.now()}-${randomUUID()}.webp`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, filename), webp);
  return { url: `/uploads/${filename}` };
}

/** Validates, re-encodes and stores an uploaded poster. Returns its /uploads URL, or an error message for the form. */
export function storePoster(file: File): Promise<{ url: string } | { error: string }> {
  return storeFormImage(file, "The poster");
}
