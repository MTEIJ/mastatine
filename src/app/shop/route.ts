import { connection, NextRequest, NextResponse } from "next/server";
import { getShopUrl } from "@/lib/shop";

// The shop has no page of its own: old links to /shop go straight to the external shop (or home when none is set).

export async function GET(req: NextRequest) {
  await connection(); // SHOP_URL is read at request time, so it must not be baked in at build time
  return NextResponse.redirect(getShopUrl() ?? new URL("/", req.url), 307);
}
