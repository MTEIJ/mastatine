import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { encodeWebp, sniffImageExt } from "@/lib/uploads";

/** Receipts are private: this folder is never served directly, only through the checked /receipts/[id] route. */
export const FINANCE_DIR = path.resolve(/* turbopackIgnore: true */ process.env.FINANCE_DIR ?? "./finance-data");

export const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
export const RECEIPT_FILENAME_RE = /^[a-z0-9-]+\.(webp|pdf)$/;

export interface StoredReceipt {
  filename: string;
  contentType: "image/webp" | "application/pdf";
  sizeBytes: number;
  sha256: string;
}

const isPdf = (bytes: Uint8Array) => String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";

/**
 * Checks the real file type from its bytes (not the client's claim), re-encodes images (drops EXIF/GPS) and writes
 * the file under a random server-made name. Returns null when it is neither a supported image nor a PDF.
 */
export async function storeReceipt(bytes: Uint8Array): Promise<StoredReceipt | null> {
  let data: Uint8Array;
  let ext: "webp" | "pdf";
  if (isPdf(bytes)) {
    data = bytes;
    ext = "pdf";
  } else if (sniffImageExt(bytes)) {
    try {
      data = await encodeWebp(bytes);
    } catch {
      return null;
    }
    ext = "webp";
  } else {
    return null;
  }

  const filename = `${randomUUID()}.${ext}`;
  await mkdir(FINANCE_DIR, { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ FINANCE_DIR, filename), data, { flag: "wx" });
  return {
    filename,
    contentType: ext === "pdf" ? "application/pdf" : "image/webp",
    sizeBytes: data.byteLength,
    sha256: createHash("sha256").update(data).digest("hex"),
  };
}

/** Removes a file whose database row could not be written, so nothing is left unreferenced. */
export async function removeReceiptFile(filename: string): Promise<void> {
  if (!RECEIPT_FILENAME_RE.test(filename)) return;
  await unlink(path.join(/* turbopackIgnore: true */ FINANCE_DIR, filename)).catch(() => {});
}

/** Reads a stored receipt and confirms it still matches the hash recorded when it was uploaded. */
export async function readReceipt(filename: string, expectedSha256: string): Promise<Buffer | null> {
  if (!RECEIPT_FILENAME_RE.test(filename)) return null;
  const data = await readFile(path.join(/* turbopackIgnore: true */ FINANCE_DIR, filename)).catch(() => null);
  if (!data) return null;
  return createHash("sha256").update(data).digest("hex") === expectedSha256 ? data : null;
}
