/**
 * /products — Server-rendered product listing page.
 *
 * Reads filter/sort state from `searchParams` (Next.js 16 async API),
 * applies filtering + sorting to the mock catalogue entirely on the server,
 * then renders a responsive grid of Card components.
 *
 * Client components:
 *   • <Filters />  — sidebar / drawer, syncs state to URL
 *   • <Sort />     — dropdown, syncs sort state to URL
 *
 * Both client components are wrapped in <Suspense> as required by Next.js
 * when they call `useSearchParams()`.
 */

import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Card from "@/components/Card";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import {
  parseSearchParams,
  buildQueryString,
  toggleFilterValue,
  setPriceRange,
  hasActiveFilters,
  type ParsedQuery,
  type ProductFilters,
} from "@/lib/utils/query";
import {
  MOCK_PRODUCTS,
  GENDER_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  PRICE_RANGES,
  type MockProduct,
} from "@/lib/data/products";

// ─────────────────────────────────────────────────────────────────────────────
// Filtering & sorting (pure, server-side)
// ─────────────────────────────────────────────────────────────────────────────

function applyFilters(
  products: MockProduct[],
  filters: ParsedQuery
): MockProduct[] {
  return products.filter((p) => {
    // Gender
    if (
      filters.gender.length > 0 &&
      !filters.gender.includes(p.genderSlug)
    )
      return false;

    // Color — product must have at least one matching color variant
    if (
      filters.color.length > 0 &&
      !p.colors.some((c) => filters.color.includes(c.slug))
    )
      return false;

    // Size — product must have at least one matching size variant
    if (
      filters.size.length > 0 &&
      !p.sizes.some((s) => filters.size.includes(s))
    )
      return false;

    // Price range (price is in cents)
    if (filters.priceMin !== undefined && p.price < filters.priceMin)
      return false;
    if (filters.priceMax !== undefined && p.price > filters.priceMax)
      return false;

    return true;
  });
}

function applySort(products: MockProduct[], sort: ParsedQuery["sort"]): MockProduct[] {
  const copy = [...products];
  switch (sort) {
    case "newest":
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "featured":
    default:
      // Featured: best-seller → sale → new → rest, then by id
      const order = { "best-seller": 0, sale: 1, new: 2, none: 3 } as const;
      return copy.sort((a, b) => {
        const ao = order[(a.badge ?? "none") as keyof typeof order] ?? 3;
        const bo = order[(b.badge ?? "none") as keyof typeof order] ?? 3;
        return ao !== bo ? ao - bo : a.id - b.id;
      });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Active-filter badge helpers
// ─────────────────────────────────────────────────────────────────────────────

interface ActiveBadge {
  label: string;
  /** ParsedQuery after removing this filter */
  nextQuery: ParsedQuery;
}

function buildActiveBadges(parsed: ParsedQuery): ActiveBadge[] {
  const badges: ActiveBadge[] = [];

  for (const slug of parsed.gender) {
    const opt = GENDER_OPTIONS.find((o) => o.slug === slug);
    if (opt)
      badges.push({
        label: opt.label,
        nextQuery: toggleFilterValue(parsed, "gender", slug),
      });
  }

  for (const slug of parsed.color) {
    const col = COLOR_OPTIONS.find((c) => c.slug === slug);
    if (col)
      badges.push({
        label: col.name,
        nextQuery: toggleFilterValue(parsed, "color", slug),
      });
  }

  for (const slug of parsed.size) {
    const sz = SIZE_OPTIONS.find((s) => s.slug === slug);
    if (sz)
      badges.push({
        label: `Size: ${sz.label}`,
        nextQuery: toggleFilterValue(parsed, "size", slug),
      });
  }

  if (parsed.priceMin !== undefined || parsed.priceMax !== undefined) {
    const range = PRICE_RANGES.find(
      (r) =>
        r.min === parsed.priceMin &&
        (r.max === Infinity
          ? parsed.priceMax === undefined
          : r.max === parsed.priceMax)
    );
    badges.push({
      label: range?.label ?? "Price range",
      nextQuery: setPriceRange(parsed, undefined, undefined),
    });
  }

  return badges;
}

// ─────────────────────────────────────────────────────────────────────────────
// Page (server component)
// ─────────────────────────────────────────────────────────────────────────────

// Next.js 16: searchParams is a Promise
interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  // Await the searchParams promise (Next.js 16 requirement)
  const rawParams = await searchParams;
  const parsed    = parseSearchParams(rawParams);

  const filtered = applyFilters(MOCK_PRODUCTS, parsed);
  const sorted   = applySort(filtered, parsed.sort);

  const activeBadges   = buildActiveBadges(parsed);
  const filtersActive  = hasActiveFilters(parsed);

  // Heading helper
  const genderLabel = parsed.gender.length === 1
    ? GENDER_OPTIONS.find((g) => g.slug === parsed.gender[0])?.label
    : undefined;

  const heading = genderLabel ? `${genderLabel}'s Shoes` : "All Products";

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-8">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="mb-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="flex items-center gap-1.5 text-footnote text-dark-500">
            <li>
              <Link href="/" className="hover:text-dark-700 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-dark-900">Products</li>
            {genderLabel && (
              <>
                <li aria-hidden="true">/</li>
                <li className="text-dark-900">{genderLabel}</li>
              </>
            )}
          </ol>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-heading-3 font-medium text-dark-900">
            {heading}
            <span className="ml-2 text-dark-500 font-normal text-body">
              ({sorted.length})
            </span>
          </h1>

          {/* Sort — client component, wrapped in Suspense */}
          <Suspense fallback={<div className="w-36 h-8 bg-light-300 animate-pulse rounded-sm" />}>
            <Sort />
          </Suspense>
        </div>
      </div>

      {/* ── Active filter badges ────────────────────────────────────────── */}
      {filtersActive && activeBadges.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 mb-5"
          aria-label="Active filters"
          role="list"
        >
          <span className="text-footnote text-dark-700 mr-1">Active:</span>
          {activeBadges.map((badge) => {
            const qs = buildQueryString(badge.nextQuery);
            return (
              <Link
                key={badge.label}
                href={`/products${qs ? `?${qs}` : ""}`}
                role="listitem"
                aria-label={`Remove filter: ${badge.label}`}
                className="
                  inline-flex items-center gap-1.5
                  px-2.5 py-1
                  bg-dark-900 text-light-100
                  rounded-full text-footnote font-medium
                  hover:bg-dark-700 transition-colors
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900 focus-visible:ring-offset-1
                "
              >
                {badge.label}
                <X size={11} aria-hidden="true" />
              </Link>
            );
          })}

          {/* Clear all */}
          <Link
            href="/products"
            className="
              text-footnote text-dark-700 underline underline-offset-2
              hover:text-dark-900 transition-colors
              focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
            "
          >
            Clear all
          </Link>
        </div>
      )}

      {/* ── Main layout: sidebar + grid ────────────────────────────────── */}
      <div className="flex gap-8 items-start">

        {/* Filters — client component, Suspense required for useSearchParams */}
        <Suspense
          fallback={
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-6 bg-light-300 animate-pulse rounded-sm" />
                ))}
              </div>
            </aside>
          }
        >
          <Filters totalCount={sorted.length} />
        </Suspense>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {/* Mobile filter trigger area */}
          <div className="flex items-center justify-between lg:hidden mb-4">
            <Suspense fallback={
              <div className="w-24 h-8 bg-light-300 animate-pulse rounded-sm" />
            }>
              <Filters totalCount={sorted.length} />
            </Suspense>

            <Suspense fallback={
              <div className="w-36 h-8 bg-light-300 animate-pulse rounded-sm" />
            }>
              <Sort />
            </Suspense>
          </div>

          {sorted.length === 0 ? (
            /* ── Empty state ────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 text-5xl" aria-hidden="true">👟</div>
              <h2 className="text-heading-3 font-medium text-dark-900 mb-2">
                No products found
              </h2>
              <p className="text-body text-dark-700 mb-6 max-w-sm">
                Try adjusting or clearing your filters to find what you&apos;re
                looking for.
              </p>
              <Link
                href="/products"
                className="
                  inline-block rounded-sm bg-dark-900 px-6 py-3
                  text-caption font-medium text-light-100
                  hover:bg-black transition-colors duration-150
                "
              >
                Clear All Filters
              </Link>
            </div>
          ) : (
            /* ── Product grid ───────────────────────────────────────────── */
            <ul
              role="list"
              aria-label="Products"
              className="
                grid gap-x-4 gap-y-10
                grid-cols-2
                sm:grid-cols-2
                md:grid-cols-3
                lg:grid-cols-3
                xl:grid-cols-4
                lg:gap-x-6
              "
            >
              {sorted.map((product) => (
                <li key={product.id}>
                  <Card
                    id={product.id}
                    name={product.name}
                    category={product.category}
                    colourCount={product.colors.length}
                    price={product.price}
                    originalPrice={product.originalPrice}
                    imageSrc={product.imageSrc}
                    badge={product.badge ?? "none"}
                    discountLabel={product.discountLabel}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
