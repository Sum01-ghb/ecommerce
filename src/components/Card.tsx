"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type BadgeVariant = "best-seller" | "sale" | "new" | "none";

export interface CardProps {

  id: string | number;

  name: string;

  category: string;

  colourCount?: number;

  price: number;

  originalPrice?: number;

  imageSrc: string;

  imageAlt?: string;

  badge?: BadgeVariant;

  discountLabel?: string;

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
  const router = useRouter();

  const handleAddToCart = onClick ?? (() => router.push(`/products/${id}`));

  const hasDiscount = originalPrice !== undefined && originalPrice > price;

  return (
    <article className="group flex flex-col">
      {}
      <Link
        href={`/products/${id}`}
        className="flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2 rounded-sm cursor-pointer"
        aria-label={`View ${name}`}
      >
        {}
        <div className="relative aspect-square w-full overflow-hidden bg-light-200 cursor-pointer">
          {}
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

          {}
          <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
            <button
              aria-label={`Add ${name} to cart`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              className="w-full rounded-sm bg-dark-900 py-2.5 text-caption font-medium text-light-100 hover:bg-black transition-colors duration-150 cursor-pointer"
            >
              Add to Cart
            </button>
          </div>
        </div>

        {}
        <div className="mt-3 flex flex-col gap-0.5">
          {}
          <h3 className="text-body-medium font-medium text-dark-900 group-hover:underline line-clamp-1">
            {name}
          </h3>

          {}
          <p className="text-caption text-dark-700">{category}</p>

          {}
          {colourCount !== undefined && (
            <p className="text-footnote text-dark-500">
              {colourCount} {colourCount === 1 ? "Colour" : "Colours"}
            </p>
          )}

          {}
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
      </Link>
    </article>
  );
}