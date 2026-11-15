import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import MerchGrid from "@/components/MerchGrid";
import { getMerchProducts } from "@/lib/spreadshop-feed";
import { getShopUrl } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Merch",
  description: "Wear the tallest opinions in the room. Pick a colour here, order on our Spreadshop.",
};

export const instant = false;

async function ProductGrid() {
  await connection(); // SHOP_URL is read at request time
  const shopUrl = getShopUrl();
  const products = await getMerchProducts();
  return (
    <>
      <MerchGrid products={products} shopUrl={shopUrl} />
      {shopUrl && (
        <p className="mt-8">
          <a href={shopUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
            See the whole shop
          </a>
        </p>
      )}
    </>
  );
}

export default function ShopPage() {
  return (
    <div className="container-page pt-8">
      <h1 className="text-3xl font-extrabold">Merch</h1>
      <p className="mb-6 mt-1 text-muted">Pick a colour to preview it, then order on our Spreadshop.</p>
      <Suspense fallback={null}>
        <ProductGrid />
      </Suspense>
      <p role="note" className="card mt-10 px-4 py-3 text-sm text-muted">
        <strong className="text-ink">Good to know:</strong> our merch is made, sold and shipped by Spreadshop, an external print-on-demand
        company, not by us. It is a real shop (promise): you pay at their checkout, and questions about an order go to them.
        Want a second opinion? Read what customers say about{" "}
        <a href="https://nl.trustpilot.com/review/www.spreadshirt.nl" target="_blank" rel="noopener noreferrer" className="font-bold text-accent-text underline underline-offset-2">
          Spreadshirt on Trustpilot
        </a>.
      </p>
    </div>
  );
}
