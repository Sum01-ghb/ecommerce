import { Suspense } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import Card from "@/components/Card";
import Filters from "@/components/Filters";
import Sort from "@/components/Sort";
import { getAllProducts } from "@/lib/actions/product";
import {
  parseSearchParams,
  parseFilterParams,
  buildQueryString,
  toggleFilterValue,
  setPriceRange,
  hasActiveFilters,
  type ParsedQuery,
  type ProductFilters,
} from "@/lib/utils/query";
import {
  GENDER_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  PRICE_RANGES,
} from "@/lib/data/products";

interface ActiveBadge {
  label: string;
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
          : r.max === parsed.priceMax),
    );
    badges.push({
      label: range?.label ?? "Price range",
      nextQuery: setPriceRange(parsed, undefined, undefined),
    });
  }

  return badges;
}

function FilterSkeleton() {
  return (
    <aside className="hidden lg:block w-56 flex-shrink-0">
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 bg-light-300 animate-pulse rounded-sm" />
        ))}
      </div>
    </aside>
  );
}

function SortSkeleton() {
  return <div className="w-36 h-8 bg-light-300 animate-pulse rounded-sm" />;
}

interface PaginationProps {
  page: number;
  totalPages: number;
  parsed: ParsedQuery;
}

function Pagination({ page, totalPages, parsed }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevQuery = buildQueryString({ ...parsed, page: page - 1 });
  const nextQuery = buildQueryString({ ...parsed, page: page + 1 });

  const delta = 2;
  const start = Math.max(1, page - delta);
  const end = Math.min(totalPages, page + delta);
  const pageNumbers = Array.from(
    { length: end - start + 1 },
    (_, i) => start + i,
  );

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 mt-12"
    >
      {page > 1 ? (
        <Link
          href={`/products${prevQuery ? `?${prevQuery}` : ""}`}
          aria-label="Previous page"
          className="
            px-3 py-1.5 rounded-sm border border-light-400
            text-caption text-dark-700
            hover:border-dark-500 hover:text-dark-900 transition-colors
            focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
          "
        >
          ←
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-sm border border-light-300 text-caption text-dark-500 cursor-not-allowed">
          ←
        </span>
      )}

      {start > 1 && (
        <>
          <Link
            href={`/products${buildQueryString({ ...parsed, page: 1 }) ? `?${buildQueryString({ ...parsed, page: 1 })}` : ""}`}
            className="px-3 py-1.5 rounded-sm border border-light-400 text-caption text-dark-700 hover:border-dark-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900"
          >
            1
          </Link>
          {start > 2 && (
            <span className="px-1 text-dark-500 text-caption">…</span>
          )}
        </>
      )}

      {pageNumbers.map((p) => {
        const q = buildQueryString({ ...parsed, page: p });
        return p === page ? (
          <span
            key={p}
            aria-current="page"
            className="px-3 py-1.5 rounded-sm bg-dark-900 text-light-100 text-caption font-medium"
          >
            {p}
          </span>
        ) : (
          <Link
            key={p}
            href={`/products${q ? `?${q}` : ""}`}
            className="px-3 py-1.5 rounded-sm border border-light-400 text-caption text-dark-700 hover:border-dark-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900"
          >
            {p}
          </Link>
        );
      })}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="px-1 text-dark-500 text-caption">…</span>
          )}
          <Link
            href={`/products${buildQueryString({ ...parsed, page: totalPages }) ? `?${buildQueryString({ ...parsed, page: totalPages })}` : ""}`}
            className="px-3 py-1.5 rounded-sm border border-light-400 text-caption text-dark-700 hover:border-dark-500 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900"
          >
            {totalPages}
          </Link>
        </>
      )}

      {page < totalPages ? (
        <Link
          href={`/products${nextQuery ? `?${nextQuery}` : ""}`}
          aria-label="Next page"
          className="
            px-3 py-1.5 rounded-sm border border-light-400
            text-caption text-dark-700
            hover:border-dark-500 hover:text-dark-900 transition-colors
            focus:outline-none focus-visible:ring-1 focus-visible:ring-dark-900
          "
        >
          →
        </Link>
      ) : (
        <span className="px-3 py-1.5 rounded-sm border border-light-300 text-caption text-dark-500 cursor-not-allowed">
          →
        </span>
      )}
    </nav>
  );
}

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 animate-pulse">
      <div className="aspect-square w-full bg-light-300 rounded-sm" />
      <div className="h-4 bg-light-300 rounded-sm w-3/4" />
      <div className="h-3 bg-light-300 rounded-sm w-1/2" />
      <div className="h-3 bg-light-300 rounded-sm w-1/3" />
    </div>
  );
}

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const rawParams = await searchParams;

  const parsed = parseSearchParams(rawParams);
  const queryParams = parseFilterParams(rawParams);

  const result = await getAllProducts(queryParams);

  const { products: productList, totalCount, page, totalPages } = result;

  const activeBadges = buildActiveBadges(parsed);
  const filtersActive = hasActiveFilters(parsed);

  const genderLabel =
    parsed.gender.length === 1
      ? GENDER_OPTIONS.find((g) => g.slug === parsed.gender[0])?.label
      : undefined;

  const heading = genderLabel ? `${genderLabel}'s Shoes` : "All Products";

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-8">
      <div className="mb-6">
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
              ({totalCount})
            </span>
          </h1>

          <Suspense fallback={<SortSkeleton />}>
            <Sort />
          </Suspense>
        </div>
      </div>

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

      <div className="flex gap-8 items-start">
        <Suspense fallback={<FilterSkeleton />}>
          <Filters totalCount={totalCount} />
        </Suspense>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between lg:hidden mb-4">
            <Suspense
              fallback={
                <div className="w-24 h-8 bg-light-300 animate-pulse rounded-sm" />
              }
            >
              <Filters totalCount={totalCount} />
            </Suspense>
            <Suspense fallback={<SortSkeleton />}>
              <Sort />
            </Suspense>
          </div>

          {productList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 text-5xl" aria-hidden="true">
                👟
              </div>
              <h2 className="text-heading-3 font-medium text-dark-900 mb-2">
                No products found
              </h2>
              <p className="text-body text-dark-700 mb-6 max-w-sm">
                {parsed.search
                  ? `No results for "${parsed.search}". Try different keywords or clear filters.`
                  : "Try adjusting or clearing your filters to find what you're looking for."}
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
            <>
              <ul
                role="list"
                aria-label="Products"
                className="
                  grid gap-x-4 gap-y-10
                  grid-cols-2
                  md:grid-cols-3
                  xl:grid-cols-4
                  lg:gap-x-6
                "
              >
                {productList.map((product) => (
                  <li key={product.id}>
                    <Card
                      id={product.id}
                      name={product.name}
                      category={`${product.genderLabel}'s ${product.category}`}
                      colourCount={product.colourCount}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      imageSrc={product.imageSrc}
                      badge={product.badge}
                      discountLabel={product.discountLabel}
                    />
                  </li>
                ))}
              </ul>

              <Pagination page={page} totalPages={totalPages} parsed={parsed} />

              {totalCount > 0 && (
                <p className="mt-6 text-center text-footnote text-dark-500">
                  Showing {Math.min((page - 1) * parsed.limit + 1, totalCount)}–
                  {Math.min(page * parsed.limit, totalCount)} of {totalCount}{" "}
                  products
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}