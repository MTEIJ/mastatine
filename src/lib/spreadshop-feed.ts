import { MERCH_PRODUCTS } from "@/content/merch";
import type { MerchColor, MerchProduct } from "@/lib/merch";
import { siteUrl } from "@/lib/env";

/**
 * The merch range, read from the shop's own Google Shopping product feed (the feed Spreadshop publishes for exactly this)
 * and enriched with colour names and codes from the official Spreadshirt API when a key is set.
 * Falls back to the snapshot in content/merch.ts when the feed cannot be read.
 */

const FEED_HOST = "https://mastatine.myspreadshop.net";
const API_BASE = "https://api.spreadshirt.net/api/v1";
const REQUEST_TIMEOUT_MS = 4000;
const FRESH_MS = 60 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000;
const UNKNOWN_HEX = "#cccccc";

interface FeedItem {
  compositionId: string;
  typeId: string;
  colorId: string;
  sellableId: string;
  slug: string;
  colorName: string;
  price: number;
  vpKey: string;
  viewId: string;
}

interface ApiColor {
  name: string;
  hex: string;
}

interface ApiType {
  name: string;
  colors: ReadonlyMap<string, ApiColor>;
}

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'" };

function decodeXml(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ENTITIES[entity] ?? entity);
}

function userAgent(): string {
  return `MastatineSite/1.0 (${siteUrl()}; ${process.env.CONTACT_EMAIL ?? "no-contact"})`;
}

function field(block: string, name: string): string | undefined {
  const match = block.match(new RegExp(`<g:${name}>([\\s\\S]*?)</g:${name}>`));
  return match ? decodeXml(match[1].trim()) : undefined;
}

/** One feed <item> is one product in one colour. Returns null for items that are out of stock or malformed. */
export function parseFeedItem(block: string): FeedItem | null {
  if (field(block, "availability") !== "in stock") return null;
  const [compositionId, typeId, colorId] = (field(block, "id") ?? "").split("_");
  const sellableId = field(block, "link")?.match(/[?&]sellable=([^&]+)/)?.[1];
  const image = field(block, "image_link")?.match(/\/products\/([^/]+)\/views\/(\d+)/);
  const slug = field(block, "title")?.split(" - ")[0];
  const price = Number.parseFloat(field(block, "price") ?? "");
  if (!compositionId || !typeId || !colorId || !sellableId || !image || !slug || !Number.isFinite(price)) return null;
  return {
    compositionId,
    typeId,
    colorId,
    sellableId,
    slug,
    colorName: field(block, "color") ?? colorId,
    price,
    vpKey: image[1],
    viewId: image[2],
  };
}

export function parseFeed(xml: string): FeedItem[] {
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return blocks.map(parseFeedItem).filter((item): item is FeedItem => item !== null);
}

function humanize(slug: string): string {
  const text = slug.replace(/-/g, " ");
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Colour names and codes per product type, from the official API. A failure only costs us the pretty names. */
async function fetchTypes(shopId: string, typeIds: readonly string[]): Promise<ReadonlyMap<string, ApiType>> {
  const key = process.env.SPREADSHIRT_API_KEY;
  if (!key) return new Map();
  const headers = { Authorization: `SprdAuth apiKey="${key}"`, "User-Agent": userAgent(), Accept: "application/json" };
  const results = await Promise.allSettled(
    typeIds.map(async (typeId) => {
      const res = await fetch(`${API_BASE}/shops/${encodeURIComponent(shopId)}/productTypes/${encodeURIComponent(typeId)}?mediaType=json`, {
        headers,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`productType ${typeId}: HTTP ${res.status}`);
      const data = (await res.json()) as { name?: string; appearances?: { id: string; name: string; colors?: { value: string }[] }[] };
      const colors = new Map<string, ApiColor>();
      for (const appearance of data.appearances ?? []) {
        colors.set(appearance.id, { name: capitalize(appearance.name), hex: appearance.colors?.[0]?.value ?? UNKNOWN_HEX });
      }
      return [typeId, { name: data.name ?? "", colors }] as const;
    }),
  );
  const types = new Map<string, ApiType>();
  for (const result of results) {
    if (result.status === "fulfilled") types.set(result.value[0], result.value[1]);
    else console.error("Spreadshirt API:", result.reason instanceof Error ? result.reason.message : result.reason);
  }
  return types;
}

function buildProducts(items: readonly FeedItem[], types: ReadonlyMap<string, ApiType>): MerchProduct[] {
  const snapshot = new Map(MERCH_PRODUCTS.map((p) => [p.slug, p]));
  const groups = new Map<string, FeedItem[]>();
  for (const item of items) {
    const key = `${item.compositionId}_${item.typeId}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return [...groups.values()].map((group) => {
    const first = group[0];
    const type = types.get(first.typeId);
    const known = snapshot.get(first.slug);
    const colors: MerchColor[] = group.map((item) => {
      const api = type?.colors.get(item.colorId);
      const old = known?.colors.find((c) => c.id === item.colorId);
      return { id: item.colorId, name: api?.name ?? old?.name ?? capitalize(item.colorName), hex: api?.hex ?? old?.hex ?? UNKNOWN_HEX };
    });
    return {
      id: first.sellableId,
      compositionId: first.compositionId,
      vpKey: first.vpKey,
      slug: first.slug,
      title: known?.title ?? humanize(first.slug),
      type: type?.name || known?.type || "Product",
      price: Math.min(...group.map((item) => item.price)),
      viewId: first.viewId,
      defaultColorId: first.colorId,
      colors,
    };
  });
}

/** Throws when the feed is unavailable. */
async function loadFeedProducts(shopId: string): Promise<MerchProduct[]> {
  const url = process.env.SPREADSHOP_FEED_URL || `${FEED_HOST}/${encodeURIComponent(shopId)}/products.rss?pushState=false&targetPlatform=google`;
  // The feed server insists on gzip; fetch asks for it and decodes it.
  const res = await fetch(url, { headers: { "User-Agent": userAgent(), "Accept-Encoding": "gzip" }, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Product feed answered HTTP ${res.status}`);
  const items = parseFeed(await res.text());
  if (items.length === 0) throw new Error("Product feed had no products in stock");
  const types = await fetchTypes(shopId, [...new Set(items.map((item) => item.typeId))]);
  return buildProducts(items, types);
}

// Kept in memory (not in the Next.js cache) so it also works in dev with caching off, and so a feed that is down
// is not retried on every page view: each attempt can cost seconds.
let cached: { products: MerchProduct[]; at: number } | null = null;
let lastFailureAt = 0;
let inFlight: Promise<MerchProduct[]> | null = null;

export async function getMerchProducts(): Promise<readonly MerchProduct[]> {
  const shopId = process.env.SPREADSHIRT_SHOP_ID;
  if (!shopId) return MERCH_PRODUCTS;
  const now = Date.now();
  if (cached && now - cached.at < FRESH_MS) return cached.products;
  if (now - lastFailureAt < RETRY_AFTER_FAILURE_MS) return cached?.products ?? MERCH_PRODUCTS;
  try {
    inFlight ??= loadFeedProducts(shopId).finally(() => {
      inFlight = null;
    });
    const products = await inFlight;
    cached = { products, at: Date.now() };
    return products;
  } catch (error) {
    lastFailureAt = Date.now();
    console.error("Could not read the merch feed, showing older data:", error instanceof Error ? error.message : error);
    return cached?.products ?? MERCH_PRODUCTS;
  }
}
