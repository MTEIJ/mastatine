"use client";

import { useState } from "react";
import { formatPrice, merchImageUrl, merchProductUrl, type MerchProduct } from "@/lib/merch";

interface MerchCardProps {
  product: MerchProduct;
  shopUrl: string | null;
}

export default function MerchCard({ product, shopUrl }: MerchCardProps) {
  const [colorId, setColorId] = useState(product.defaultColorId);
  const color = product.colors.find((c) => c.id === colorId) ?? product.colors[0];
  const href = merchProductUrl(shopUrl, product, color.id);

  return (
    <li className="card flex flex-col overflow-hidden">
      <a href={href} target="_blank" rel="noopener noreferrer" className="block bg-accent-soft" aria-label={`${product.title}, ${product.type}, ${color.name}: order on the Spreadshop`}>
        {/* A plain img on purpose: the image server only answers real browsers, so it must not go through our image proxy. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={merchImageUrl(product, color.id)}
          alt={`${product.title} (${product.type}) in ${color.name}`}
          width={600}
          height={600}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="aspect-square w-full object-contain"
        />
      </a>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2 className="text-lg font-extrabold leading-snug">{product.title}</h2>
          <p className="text-sm text-muted">{product.type}</p>
        </div>
        <fieldset>
          <legend className="text-sm text-muted">
            Colour: <span className="font-semibold text-ink">{color.name}</span>
            <span className="ml-1">({product.colors.length} available)</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.colors.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColorId(c.id)}
                aria-label={c.name}
                aria-pressed={c.id === color.id}
                title={c.name}
                style={{ backgroundColor: c.hex }}
                className={`size-7 rounded-full border border-line ${c.id === color.id ? "ring-2 ring-accent ring-offset-2" : ""}`}
              />
            ))}
          </div>
        </fieldset>
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <p className="text-xl font-extrabold">{formatPrice(product.price)}</p>
          <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Order on Spreadshop
          </a>
        </div>
      </div>
    </li>
  );
}
