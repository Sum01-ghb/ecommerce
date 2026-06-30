"use client";

import React from "react";
import { useCartStore } from "@/store/useCartStore";
import { Plus } from "lucide-react";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // in cents
  imageUrl: string;
  category: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const addToCart = useCartStore((state) => state.addToCart);

  // Format price (price is in cents)
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(product.price / 100);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-neutral-300 hover:shadow-xl dark:border-neutral-800/60 dark:bg-neutral-900/70 dark:hover:border-neutral-700">
      {/* Product Image Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Category Badge */}
        <span className="absolute top-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-sm dark:bg-neutral-900/95 dark:text-white">
          {product.category}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-black dark:group-hover:text-neutral-200 transition-colors">
            {product.name}
          </h4>
          <span className="text-base font-black text-neutral-950 dark:text-neutral-100 whitespace-nowrap">
            {formattedPrice}
          </span>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 line-clamp-2">
          {product.description}
        </p>

        {/* Action Button at bottom */}
        <div className="mt-auto pt-5">
          <button
            onClick={() => addToCart({
              id: product.id,
              name: product.name,
              price: product.price,
              imageUrl: product.imageUrl,
            })}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white transition-all duration-300 hover:bg-black dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white hover:shadow-lg active:scale-98"
          >
            <Plus size={15} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </div>
  );
}
