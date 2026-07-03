/**
 * /products/[id] — Server-rendered Product Detail Page
 *
 * Architecture
 * ────────────
 * • This file is a pure server component.
 * • Interactive UI (gallery, size picker, collapsibles) → isolated client components.
 * • Reviews and "Also Like" → server components loaded in <Suspense> so they
 *   never block the main PDP content.
 * • Uses real DB data via getProduct(), getProductReviews(), getRecommendedProducts().
 * • Returns a styled Not-Found block when the product doesn't exist.
 *
 * Responsiveness
 * ──────────────
 * • Mobile  : single-column; gallery on top (main image → thumbnail row below).
 * • Tablet  : 2-column split with a narrower info panel.
 * • Desktop : side-by-side gallery (left) + info (right, 400–440 px fixed width).
 */

import { Suspense }    from "react";
import Link            from "next/link";
import { Heart } from "lucide-react";

import { getProduct }          from "@/lib/actions/product";
import type { ProductDetail }  from "@/lib/actions/product";

import ProductGalleryDB, {
  ProductGalleryDBSkeleton,
}                              from "@/components/ProductGalleryDB";
import ProductActions          from "@/components/ProductActions";
import CollapsibleSection      from "@/components/CollapsibleSection";
import ReviewsSection          from "@/components/ReviewsSection";
import ReviewsSkeleton         from "@/components/ReviewsSkeleton";
import RecommendedProductsSection from "@/components/RecommendedProductsSection";
import RecommendedSkeleton     from "@/components/RecommendedSkeleton";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Format cents → "$140.00" */
function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Build the variantId → colorId map required by ProductGalleryDB.
 * This lets the gallery filter images by selected color purely client-side.
 */
function buildVariantColorMap(
  product: ProductDetail
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const v of product.variants) {
    map[v.id] = v.colorId;
  }
  return map;
}

// ─────────────────────────────────────────────────────────────────────────────
// Not Found block
// ─────────────────────────────────────────────────────────────────────────────

function ProductNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 px-4 text-center">
      {/* Shoe icon */}
      <div className="mb-6 text-6xl" aria-hidden="true">👟</div>

      <h1 className="text-heading-3 font-medium text-dark-900 mb-2">
        Product Not Found
      </h1>
      <p className="text-body text-dark-700 mb-8 max-w-sm">
        We couldn&apos;t find the product you&apos;re looking for. It may have
        been removed or the link might be incorrect.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/products"
          className="
            inline-block rounded-full bg-dark-900 px-6 py-3
            text-caption font-medium text-light-100
            hover:bg-black transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
          "
        >
          Browse All Products
        </Link>
        <Link
          href="/"
          className="
            inline-block rounded-full border border-light-400 bg-light-100 px-6 py-3
            text-caption font-medium text-dark-900
            hover:border-dark-500 transition-colors duration-150
            focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
          "
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Product info panel (server-rendered)
// ─────────────────────────────────────────────────────────────────────────────

function ProductMeta({ product }: { product: ProductDetail }) {
  const hasDiscount = product.minPrice < product.maxPrice
    ? false // price range — no single "original" to show
    : false; // evaluated per-variant; we use minPrice for display

  // Determine if any variant has a sale price
  const cheapestVariant = product.variants.reduce(
    (best, v) => (v.price < (best?.price ?? Infinity) ? v : best),
    null as typeof product.variants[0] | null
  );

  const displayPrice    = cheapestVariant?.price ?? product.minPrice;
  const comparePrice    = cheapestVariant?.salePrice; // original price (when sale)
  const isOnSale        = comparePrice !== undefined && comparePrice > displayPrice;

  const discountPct = isOnSale && comparePrice
    ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
    : 0;

  const categoryLabel = `${product.gender.label}'s ${product.category.name}`;

  return (
    <div>
      {/* Name + category */}
      <div className="mb-3">
        <h1 className="text-heading-3 font-medium text-dark-900 leading-tight">
          {product.name}
        </h1>
        <p className="text-caption text-dark-700 mt-1">{categoryLabel}</p>
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-center gap-2.5 mb-1">
        <span
          className={`text-body-medium font-medium ${isOnSale ? "text-red" : "text-dark-900"}`}
        >
          {formatPrice(displayPrice)}
        </span>
        {isOnSale && comparePrice && (
          <>
            <span className="text-caption text-dark-500 line-through">
              {formatPrice(comparePrice)}
            </span>
            <span className="text-footnote font-medium text-red">
              -{discountPct}%
            </span>
          </>
        )}
      </div>

      {/* Brand / style metadata */}
      <p className="text-footnote text-dark-500 mb-5">
        {product.brand.name} · {product.gender.label}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PDP skeleton (shown while Suspense resolves the gallery / product section)
// ─────────────────────────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* Gallery skeleton */}
        <div className="flex-1">
          <ProductGalleryDBSkeleton />
        </div>
        {/* Info skeleton */}
        <div className="lg:w-[400px] xl:w-[440px] flex-shrink-0 space-y-4">
          <div className="h-7 w-3/4 bg-light-300 rounded-sm" />
          <div className="h-5 w-1/3 bg-light-300 rounded-sm" />
          <div className="h-6 w-1/4 bg-light-300 rounded-sm" />
          <div className="h-3 w-1/2 bg-light-300 rounded-sm" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10 bg-light-300 rounded-sm" />
            ))}
          </div>
          <div className="h-12 w-full bg-light-300 rounded-sm mt-4" />
          <div className="h-12 w-full bg-light-300 rounded-sm" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────────────────────

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  // Fetch product — returns null for unpublished or missing products
  const product = await getProduct(id);

  // ── Not found ──────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Breadcrumb still useful for navigation context */}
        <nav
          aria-label="Breadcrumb"
          className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-16 pt-5 pb-2"
        >
          <ol className="flex items-center gap-1.5 text-footnote text-dark-500">
            <li>
              <Link href="/" className="hover:text-dark-700 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/products" className="hover:text-dark-700 transition-colors">
                Products
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-dark-900">Not Found</li>
          </ol>
        </nav>
        <ProductNotFound />
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const variantColorMap = buildVariantColorMap(product);

  // Only surface the first color — the seed stores one primary image per product
  // (not tied to any specific color variant), so showing multiple color swatches
  // would mislead users into thinking each color has its own distinct image.
  // When more color-specific images are added to the DB, remove this slice.
  const singleColor = product.availableColors.slice(0, 1);

  // Badge text for the gallery
  const galleryBadge =
    product.variants.some((v) => v.inStock > 0) ? "In Stock" : undefined;

  return (
    <div className="flex-1">
      {/* ── Breadcrumb ──────────────────────────────────────────────────── */}
      <nav
        aria-label="Breadcrumb"
        className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 pt-5 pb-2"
      >
        <ol className="flex items-center gap-1.5 text-footnote text-dark-500">
          <li>
            <Link href="/" className="hover:text-dark-700 transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/products" className="hover:text-dark-700 transition-colors">
              Products
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li
            className="text-dark-900 truncate max-w-[180px]"
            title={product.name}
          >
            {product.name}
          </li>
        </ol>
      </nav>

      {/* ── Main product section ─────────────────────────────────────────── */}
      <Suspense fallback={<ProductDetailSkeleton />}>
        <article
          aria-label={product.name}
          className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-6 lg:py-10"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

            {/* ── Left: Gallery ────────────────────────────────────────────
              Mobile  : full-width; main image top, thumbnails scroll below.
              Desktop : vertical thumbnail strip left + main image right.
            ─────────────────────────────────────────────────────────────── */}
            <div className="w-full lg:flex-1 min-w-0">
              <ProductGalleryDB
                images={product.images}
                availableColors={singleColor}
                variantColorMap={variantColorMap}
                badge={galleryBadge}
              />
            </div>

            {/* ── Right: Product info ───────────────────────────────────── */}
            <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0">

              {/* Name, category, price, brand */}
              <ProductMeta product={product} />

              {/* ── Size Picker + Add to Cart ────────────────────── */}
              <ProductActions
                availableSizes={product.availableSizes}
                variants={product.variants}
                productName={product.name}
                selectedColorId={singleColor[0]?.id}
              />

              {/* Favourite — placeholder */}
              <div className="mb-6 -mt-3">
                <button
                  type="button"
                  aria-label={`Add ${product.name} to favourites`}
                  className="
                    w-full flex items-center justify-center gap-2
                    rounded-full border border-light-400 bg-light-100 text-dark-900
                    py-3.5 text-caption font-medium
                    hover:border-dark-500 hover:bg-light-200 transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
                  "
                >
                  <Heart size={16} aria-hidden="true" />
                  Favourite
                </button>
              </div>

              {/* ── Collapsible sections ─────────────────────────────────── */}

              {/* Product Details */}
              <CollapsibleSection title="Product Details" defaultOpen>
                <div className="text-caption text-dark-700 space-y-3">
                  <p>{product.description}</p>
                  <dl className="space-y-1">
                    <div className="flex gap-1.5 items-start">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-dark-700 flex-shrink-0" aria-hidden="true" />
                      <span>
                        <span className="font-medium text-dark-900">Brand:</span>{" "}
                        {product.brand.name}
                      </span>
                    </div>
                    <div className="flex gap-1.5 items-start">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-dark-700 flex-shrink-0" aria-hidden="true" />
                      <span>
                        <span className="font-medium text-dark-900">Category:</span>{" "}
                        {product.category.name}
                      </span>
                    </div>
                    {singleColor.length > 0 && (
                      <div className="flex gap-1.5 items-start">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-dark-700 flex-shrink-0" aria-hidden="true" />
                        <span>
                          <span className="font-medium text-dark-900">Colour:</span>{" "}
                          {singleColor[0].name}
                        </span>
                      </div>
                    )}
                  </dl>
                </div>
              </CollapsibleSection>

              {/* Shipping & Returns */}
              <CollapsibleSection title="Shipping & Returns">
                <div className="text-caption text-dark-700 space-y-2">
                  <p>
                    Free standard shipping on orders over $50. Orders are typically
                    processed within 1–2 business days.
                  </p>
                  <p>
                    Free returns within 60 days of purchase. Items must be unworn
                    and in original packaging.
                  </p>
                  <p className="text-footnote text-dark-500">
                    Estimated delivery: 3–5 business days (standard),
                    1–2 business days (express).
                  </p>
                </div>
              </CollapsibleSection>

              {/* Reviews — Suspense-wrapped: non-blocking */}
              <CollapsibleSection title="Customer Reviews">
                <Suspense fallback={<ReviewsSkeleton />}>
                  <ReviewsSection productId={product.id} />
                </Suspense>
              </CollapsibleSection>
            </div>
          </div>
        </article>
      </Suspense>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="border-t border-light-300 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16" />

      {/* ── You Might Also Like — non-blocking ──────────────────────────── */}
      <div className="pt-12">
        <Suspense fallback={<RecommendedSkeleton />}>
          <RecommendedProductsSection productId={product.id} />
        </Suspense>
      </div>
    </div>
  );
}
