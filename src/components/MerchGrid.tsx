"use client";

import { useMemo, useState } from "react";
import MerchCard from "@/components/MerchCard";
import type { MerchProduct } from "@/lib/merch";

interface MerchGridProps {
  products: readonly MerchProduct[];
  shopUrl: string | null;
}

const ALL = "All";

function categoryOf(product: MerchProduct): string {
  const type = product.type.toLowerCase();
  if (type.includes("shirt")) return "T-shirts";
  if (type.includes("sticker")) return "Stickers";
  if (type.includes("sock")) return "Socks";
  return "Other";
}

function matches(product: MerchProduct, query: string): boolean {
  if (query === "") return true;
  const haystack = [product.title, product.type, ...product.colors.map((c) => c.name)].join(" ").toLowerCase();
  return query.split(/\s+/).every((word) => haystack.includes(word));
}

export default function MerchGrid({ products, shopUrl }: MerchGridProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(ALL);
  const categories = useMemo(() => [ALL, ...new Set(products.map(categoryOf))], [products]);
  const needle = query.trim().toLowerCase();
  const visible = products.filter((p) => (category === ALL || categoryOf(p) === category) && matches(p, needle));

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or colour"
          aria-label="Search merch by name or colour"
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by type">
          {categories.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setCategory(name)}
              aria-pressed={name === category}
              className={`btn ${name === category ? "btn-primary" : "btn-secondary"}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      {visible.length === 0 ? (
        <p className="text-muted">Nothing matches that. Try another colour or clear the filter.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <MerchCard key={product.id} product={product} shopUrl={shopUrl} />
          ))}
        </ul>
      )}
    </>
  );
}
