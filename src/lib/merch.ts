export interface MerchColor {
  /** Spreadshop "appearance" id. */
  id: string;
  name: string;
  hex: string;
}

export interface MerchProduct {
  id: string;
  compositionId: string;
  /** Spreadshop product key; the image server renders the product from it. */
  vpKey: string;
  slug: string;
  title: string;
  type: string;
  price: number;
  viewId: string;
  defaultColorId: string;
  colors: readonly MerchColor[];
}

const IMAGE_BASE = "https://image.spreadshirtmedia.net/image-server/v1/products";
const FALLBACK_SHOP_URL = "https://mastatine.myspreadshop.nl";

/** Preview of the product in one colour. Loaded by the visitor's browser, never by our server. */
export function merchImageUrl(product: MerchProduct, colorId: string, size = 600): string {
  const key = encodeURIComponent(product.vpKey);
  return `${IMAGE_BASE}/${key}/views/${product.viewId}/${product.slug}.png?width=${size}&height=${size}&appearanceId=${encodeURIComponent(colorId)}`;
}

/** The product's page on the Spreadshop, opened in the chosen colour. */
export function merchProductUrl(shopUrl: string | null, product: MerchProduct, colorId: string): string {
  const base = (shopUrl ?? FALLBACK_SHOP_URL).replace(/\/+$/, "");
  const query = new URLSearchParams({ sellable: product.id, appearance: colorId });
  return `${base}/${product.slug}-A${product.compositionId}?${query}`;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-NL", { style: "currency", currency: "EUR" }).format(amount);
}
