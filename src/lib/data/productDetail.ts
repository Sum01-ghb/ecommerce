/**
 * productDetail.ts — Static mock data for the Product Details page.
 *
 * Each product has multiple colour variants, each with their own gallery images.
 * All prices are in cents (e.g. 14000 = $140.00).
 * Images reference files that exist in /public/shoes/.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductVariantImage {
  src: string;
  alt: string;
}

export interface ProductVariant {
  /** Slug used to identify this colour option */
  colorSlug: string;
  /** Display name shown in UI */
  colorName: string;
  /** Hex code used for the swatch */
  hexCode: string;
  /** Gallery images for this colour variant (first = main image) */
  images: ProductVariantImage[];
}

export interface ProductSize {
  /** Display label e.g. "5", "5.5", "W 7" */
  label: string;
  /** Whether this size is available */
  available: boolean;
}

export interface ProductDetail {
  id: number;
  name: string;
  /** Short subtitle, e.g. "Women's Shoes" */
  category: string;
  /** Selling price in cents */
  price: number;
  /** Original / compare-at price in cents (undefined = no discount) */
  originalPrice?: number;
  /** Discount label shown in green, e.g. "Extra 20% off w/ code SPORT" */
  promoLabel?: string;
  /** Badge variant — mirrors CardProps badge */
  badge?: "best-seller" | "sale" | "new";
  /** Highlights shown in the collapsible "Product Details" section */
  highlights: string[];
  /** Longer paragraph description */
  description: string;
  /** Style/SKU code */
  styleCode: string;
  /** Available colour variants (first = default) */
  variants: ProductVariant[];
  /** Available sizes */
  sizes: ProductSize[];
  /** Star rating out of 5 */
  rating: number;
  /** Total number of reviews */
  reviewCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock catalogue
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCT_DETAILS: Record<number, ProductDetail> = {
  1: {
    id: 1,
    name: "Nike Air Max 90 SE",
    category: "Women's Shoes",
    price: 14000,
    promoLabel: "Extra 20% off w/ code SPORT",
    badge: "best-seller",
    highlights: [
      "Padded collar",
      "Foam midsole",
      "Shown: Dark Team Red/Platinum Tint/Pure Platinum/White",
      "Style: HM9451-600",
    ],
    description:
      "The Air Max 90 stays true to its running roots with the iconic Waffle sole. Plus, stitched overlays and textured accents create a '90s look you love. Complete with romantic hues, its visible Air cushioning adds comfort to your journey.",
    styleCode: "HM9451-600",
    variants: [
      {
        colorSlug: "dark-team-red",
        colorName: "Dark Team Red",
        hexCode: "#7B1C1C",
        images: [
          { src: "/shoes/shoe-1.jpg",  alt: "Nike Air Max 90 SE — Dark Team Red — Side view" },
          { src: "/shoes/shoe-5.avif", alt: "Nike Air Max 90 SE — Dark Team Red — Top view" },
          { src: "/shoes/shoe-6.avif", alt: "Nike Air Max 90 SE — Dark Team Red — Back view" },
          { src: "/shoes/shoe-7.avif", alt: "Nike Air Max 90 SE — Dark Team Red — Sole view" },
          { src: "/shoes/shoe-8.avif", alt: "Nike Air Max 90 SE — Dark Team Red — Detail view" },
          { src: "/shoes/shoe-9.avif", alt: "Nike Air Max 90 SE — Dark Team Red — Inner view" },
        ],
      },
      {
        colorSlug: "black",
        colorName: "Black",
        hexCode: "#111111",
        images: [
          { src: "/shoes/shoe-10.avif", alt: "Nike Air Max 90 SE — Black — Side view" },
          { src: "/shoes/shoe-11.avif", alt: "Nike Air Max 90 SE — Black — Top view" },
          { src: "/shoes/shoe-12.avif", alt: "Nike Air Max 90 SE — Black — Back view" },
        ],
      },
      {
        colorSlug: "midnight-navy",
        colorName: "Midnight Navy",
        hexCode: "#1E3A5F",
        images: [
          { src: "/shoes/shoe-13.avif", alt: "Nike Air Max 90 SE — Midnight Navy — Side view" },
          { src: "/shoes/shoe-14.avif", alt: "Nike Air Max 90 SE — Midnight Navy — Top view" },
        ],
      },
      {
        colorSlug: "platinum-tint",
        colorName: "Platinum Tint",
        hexCode: "#C8C8C8",
        images: [
          { src: "/shoes/shoe-15.avif", alt: "Nike Air Max 90 SE — Platinum Tint — Side view" },
          { src: "/shoes/shoe-2.webp",  alt: "Nike Air Max 90 SE — Platinum Tint — Top view" },
        ],
      },
      {
        colorSlug: "white",
        colorName: "White",
        hexCode: "#FFFFFF",
        images: [
          { src: "/shoes/shoe-3.webp", alt: "Nike Air Max 90 SE — White — Side view" },
          { src: "/shoes/shoe-4.webp", alt: "Nike Air Max 90 SE — White — Top view" },
        ],
      },
      {
        colorSlug: "volt",
        colorName: "Volt",
        hexCode: "#D4EA00",
        images: [
          { src: "/shoes/shoe-4.webp", alt: "Nike Air Max 90 SE — Volt — Side view" },
          { src: "/shoes/shoe-3.webp", alt: "Nike Air Max 90 SE — Volt — Top view" },
        ],
      },
    ],
    sizes: [
      { label: "5",    available: true  },
      { label: "5.5",  available: true  },
      { label: "6",    available: true  },
      { label: "6.5",  available: true  },
      { label: "7",    available: true  },
      { label: "7.5",  available: true  },
      { label: "8",    available: true  },
      { label: "8.5",  available: true  },
      { label: "9",    available: true  },
      { label: "9.5",  available: true  },
      { label: "10",   available: false },
      { label: "10.5", available: false },
      { label: "11",   available: false },
    ],
    rating: 5,
    reviewCount: 10,
  },

  2: {
    id: 2,
    name: "Nike Court Vision Low Next Nature",
    category: "Men's Shoes",
    price: 8000,
    originalPrice: 9500,
    promoLabel: "Extra 20% off w/ code SPORT",
    badge: "sale",
    highlights: [
      "Leather and synthetic upper",
      "Cupsole construction",
      "Made with at least 20% recycled content by weight",
      "Style: DH3158-100",
    ],
    description:
      "Born from the hardwood but built for the streets, the Nike Court Vision Low Next Nature channels '80s basketball style while using recycled materials to help reduce waste.",
    styleCode: "DH3158-100",
    variants: [
      {
        colorSlug: "white-black",
        colorName: "White / Black",
        hexCode: "#F5F5F5",
        images: [
          { src: "/shoes/shoe-2.webp",  alt: "Nike Court Vision Low — White/Black — Side view" },
          { src: "/shoes/shoe-3.webp",  alt: "Nike Court Vision Low — White/Black — Top view" },
          { src: "/shoes/shoe-4.webp",  alt: "Nike Court Vision Low — White/Black — Back view" },
        ],
      },
      {
        colorSlug: "black",
        colorName: "Black",
        hexCode: "#111111",
        images: [
          { src: "/shoes/shoe-10.avif", alt: "Nike Court Vision Low — Black — Side view" },
          { src: "/shoes/shoe-11.avif", alt: "Nike Court Vision Low — Black — Top view" },
        ],
      },
    ],
    sizes: [
      { label: "7",  available: true  },
      { label: "8",  available: true  },
      { label: "9",  available: true  },
      { label: "10", available: true  },
      { label: "11", available: true  },
      { label: "12", available: false },
    ],
    rating: 4,
    reviewCount: 24,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Lookup helper — returns the first product as default for unknown IDs
// ─────────────────────────────────────────────────────────────────────────────

export function getProductDetail(id: number): ProductDetail {
  return PRODUCT_DETAILS[id] ?? PRODUCT_DETAILS[1];
}
