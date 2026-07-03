/**
 * /products/[id] — Server-rendered Product Detail Page
 *
 * Architecture:
 *   • This file is a pure server component.
 *   • Interactive UI (gallery, size picker, collapsible sections) is
 *     delegated to isolated client components in /components.
 *   • Mock data only — no DB, no fetching, no cart/favourite logic.
 */

import { Suspense } from "react";
import Link from "next/link";
import { Heart, ShoppingBag, Star } from "lucide-react";

import { getProductDetail }       from "@/lib/data/productDetail";
import { MOCK_PRODUCTS }          from "@/lib/data/products";
import Card                        from "@/components/Card";
import ProductGallery, {
  ProductGallerySkeleton,
}                                  from "@/components/ProductGallery";
import SizePicker                  from "@/components/SizePicker";
import CollapsibleSection          from "@/components/CollapsibleSection";

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

/** Render filled / empty star icons for a rating */
function StarRating({ rating, total = 5 }: { rating: number; total?: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of ${total} stars`}>
      {Array.from({ length: total }).map((_, i) => (
        <Star
          key={i}
          size={13}
          aria-hidden="true"
          className={i < rating ? "fill-dark-900 text-dark-900" : "text-light-400"}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page skeleton (Suspense fallback for the whole page)
// ─────────────────────────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-8 animate-pulse">
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        <div className="flex-1">
          <ProductGallerySkeleton />
        </div>
        <div className="lg:w-[400px] xl:w-[440px] flex-shrink-0 space-y-4">
          <div className="h-7 w-3/4 bg-light-300 rounded-sm" />
          <div className="h-5 w-1/3 bg-light-300 rounded-sm" />
          <div className="h-6 w-1/4 bg-light-300 rounded-sm" />
          <div className="h-4 w-1/2 bg-light-300 rounded-sm" />
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
// "You Might Also Like" section
// ─────────────────────────────────────────────────────────────────────────────

interface RecommendedProductsProps {
  currentProductId: number;
}

function RecommendedProducts({ currentProductId }: RecommendedProductsProps) {
  // Take 3 products, skipping the current one
  const recommended = MOCK_PRODUCTS.filter((p) => p.id !== currentProductId).slice(0, 3);

  if (recommended.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 pb-16">
      <h2 className="text-heading-3 font-medium text-dark-900 mb-6">
        You Might Also Like
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:gap-x-6">
        {recommended.map((product) => (
          <Card
            key={product.id}
            id={product.id}
            name={product.name}
            category={product.category}
            colourCount={product.colors.length}
            price={product.price}
            originalPrice={product.originalPrice}
            imageSrc={product.imageSrc}
            badge={product.badge}
            discountLabel={product.discountLabel}
          />
        ))}
      </div>
    </section>
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
  const productId = parseInt(id, 10);
  const product   = getProductDetail(isNaN(productId) ? 1 : productId);

  const hasDiscount =
    product.originalPrice !== undefined && product.originalPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.originalPrice! - product.price) / product.originalPrice!) * 100
      )
    : 0;

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
          <li className="text-dark-900 truncate max-w-[180px]">{product.name}</li>
        </ol>
      </nav>

      {/* ── Main product section ─────────────────────────────────────────── */}
      <Suspense fallback={<ProductDetailSkeleton />}>
        <article
          aria-label={product.name}
          className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-6 lg:py-10"
        >
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">

            {/* ── Left: Gallery ─────────────────────────────────────────── */}
            <div className="w-full lg:flex-1 min-w-0">
              <ProductGallery
                variants={product.variants}
                badge={product.badge === "best-seller" ? "Highly Rated" : undefined}
              />
            </div>

            {/* ── Right: Product info ───────────────────────────────────── */}
            <div className="w-full lg:w-[400px] xl:w-[440px] flex-shrink-0">

              {/* Name + category */}
              <div className="mb-3">
                <h1 className="text-heading-3 font-medium text-dark-900">
                  {product.name}
                </h1>
                <p className="text-caption text-dark-700 mt-0.5">
                  {product.category}
                </p>
              </div>

              {/* Price */}
              <div className="flex items-center gap-3 mb-1">
                <span
                  className={`text-body-medium font-medium ${
                    hasDiscount ? "text-red" : "text-dark-900"
                  }`}
                >
                  {formatPrice(product.price)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-caption text-dark-500 line-through">
                      {formatPrice(product.originalPrice!)}
                    </span>
                    <span className="text-footnote font-medium text-red">
                      -{discountPercent}%
                    </span>
                  </>
                )}
              </div>

              {/* Promo label */}
              {product.promoLabel && (
                <p className="text-caption text-green font-medium mb-4">
                  {product.promoLabel}
                </p>
              )}

              {/* ── Size Picker (client) ─────────────────────────────── */}
              <div className="my-5">
                <SizePicker sizes={product.sizes} />
              </div>

              {/* ── CTA Buttons ──────────────────────────────────────── */}
              <div className="flex flex-col gap-3 mb-6">
                {/* Add to Bag — static UI */}
                <button
                  type="button"
                  aria-label={`Add ${product.name} to bag`}
                  className="
                    w-full flex items-center justify-center gap-2
                    rounded-full bg-dark-900 text-light-100
                    py-3.5 text-caption font-medium
                    hover:bg-black transition-colors duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
                  "
                >
                  <ShoppingBag size={16} aria-hidden="true" />
                  Add to Bag
                </button>

                {/* Favourite — static UI */}
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

              {/* ── Collapsible Sections (client) ─────────────────────── */}

              {/* Product Details */}
              <CollapsibleSection title="Product Details" defaultOpen>
                <div className="text-caption text-dark-700 space-y-3">
                  <p>{product.description}</p>
                  {product.highlights.length > 0 && (
                    <ul className="space-y-1 list-none">
                      {product.highlights.map((highlight) => (
                        <li key={highlight} className="flex items-start gap-1.5">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-dark-700 flex-shrink-0" aria-hidden="true" />
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  )}
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
                    Free returns within 60 days of purchase. Items must be unworn and
                    in original packaging.
                  </p>
                  <p className="text-footnote text-dark-500">
                    Estimated delivery: 3–5 business days (standard), 1–2 business days
                    (express).
                  </p>
                </div>
              </CollapsibleSection>

              {/* Reviews */}
              <CollapsibleSection
                title={`Reviews (${product.reviewCount})`}
                headerSlot={<StarRating rating={product.rating} />}
              >
                {product.reviewCount === 0 ? (
                  <p className="text-caption text-dark-500">
                    No reviews yet. Be the first to review this product.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {/* Empty reviews state — placeholder until real data */}
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                      <StarRating rating={product.rating} />
                      <p className="text-body-medium font-medium text-dark-900">
                        {product.rating.toFixed(1)} out of 5
                      </p>
                      <p className="text-caption text-dark-500">
                        Based on {product.reviewCount}{" "}
                        {product.reviewCount === 1 ? "review" : "reviews"}
                      </p>
                    </div>
                  </div>
                )}
              </CollapsibleSection>
            </div>
          </div>
        </article>
      </Suspense>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="border-t border-light-300 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16" />

      {/* ── You Might Also Like ──────────────────────────────────────────── */}
      <div className="pt-12">
        <RecommendedProducts currentProductId={product.id} />
      </div>
    </div>
  );
}
