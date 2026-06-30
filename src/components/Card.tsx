"use client";


import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";

export type BadgeVariant = "best-seller" | "sale" | "new" | "none";

export interface CardProps {
  /** Product unique id */
  id: number;
  /** Product name */
  name: string;
  /** Short category or sub-title, e.g. "Men's Shoes" */
  category: string;
  /** Number of colour options available */
  colourCount?: number;
  /** Price in cents (e.g. 11500 → $115.00) */
  price: number;
  /** Original / compare-at price in cents (shows strike-through) */
  originalPrice?: number;
  /** Absolute path to the product image inside /public */
  imageSrc: string;
  /** Alt text for the image */
  imageAlt?: string;
  /** Optional badge shown at top-left of the image */
  badge?: BadgeVariant;
  /** Optional discount % label shown next to badge when badge is 'sale' */
  discountLabel?: string;
  /** Optional click handler override (defaults to addToCart) */
  onClick?: () => void;
}

const BADGE_STYLES: Record<Exclude<BadgeVariant, "none">, string> = {
  "best-seller": "bg-green text-light-100",
  sale: "bg-red text-light-100",
  new: "bg-dark-900 text-light-100",
};

const BADGE_LABELS: Record<Exclude<BadgeVariant, "none">, string> = {
  "best-seller": "Best Seller",
  sale: "Sale",
  new: "New",
};

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function Card({
  id,
  name,
  category,
  colourCount,
  price,
  originalPrice,
  imageSrc,
  imageAlt,
  badge = "none",
  discountLabel,
  onClick,
}: CardProps) {
  const addToCart = useCartStore((s) => s.addToCart);

  const handleClick = onClick
    ? onClick
    : () => addToCart({ id, name, price, imageUrl: imageSrc });

  const hasDiscount = originalPrice !== undefined && originalPrice > price;

  return (
    <article className="group flex flex-col cursor-pointer" onClick={handleClick}>
      {/* Image container */}
      <div className="relative aspect-square w-full overflow-hidden bg-light-200">
        {/* Badge */}
        {badge !== "none" && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
            <span
              className={`inline-block rounded-sm px-2 py-0.5 text-footnote font-medium ${BADGE_STYLES[badge]}`}
            >
              {BADGE_LABELS[badge]}
            </span>
            {badge === "sale" && discountLabel && (
              <span className="inline-block rounded-sm bg-orange px-2 py-0.5 text-footnote font-medium text-light-100">
                {discountLabel}
              </span>
            )}
          </div>
        )}

        <Image
          src={imageSrc}
          alt={imageAlt ?? name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Hover CTA overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
          <button
            aria-label={`Add ${name} to cart`}
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="w-full rounded-sm bg-dark-900 py-2.5 text-caption font-medium text-light-100 hover:bg-black transition-colors duration-150"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-col gap-0.5">
        {/* Name */}
        <h3 className="text-body-medium font-medium text-dark-900 group-hover:underline line-clamp-1">
          {name}
        </h3>

        {/* Category */}
        <p className="text-caption text-dark-700">{category}</p>

        {/* Colour count */}
        {colourCount !== undefined && (
          <p className="text-footnote text-dark-500">
            {colourCount} {colourCount === 1 ? "Colour" : "Colours"}
          </p>
        )}

        {/* Price row */}
        <div className="mt-1 flex items-center gap-2">
          <span
            className={`text-body-medium font-medium ${hasDiscount ? "text-red" : "text-dark-900"}`}
          >
            {formatPrice(price)}
          </span>
          {hasDiscount && (
            <span className="text-caption text-dark-500 line-through">
              {formatPrice(originalPrice!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
