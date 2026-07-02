/**
 * query.ts — URL query parameter helpers for the products filter/sort UI.
 *
 * All functions are pure (no side effects) and use `query-string` for
 * consistent parsing and serialisation.
 *
 * Conventions
 * ───────────
 *  • Multi-value params (gender, color, size) are stored as comma-separated
 *    strings so the URL stays readable:
 *      ?gender=men,women&color=red,black&size=us-8,us-9
 *  • Single-value params (sort, page) are plain strings.
 *  • Page resets to 1 whenever filters or sort change.
 */

import qs from "query-string";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SortOption =
  | "featured"
  | "newest"
  | "price_desc"
  | "price_asc";

export interface ProductFilters {
  gender: string[];
  color: string[];
  size: string[];
  priceMin?: number;
  priceMax?: number;
}

export interface ParsedQuery extends ProductFilters {
  sort: SortOption;
  page: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SORT: SortOption = "featured";
export const DEFAULT_PAGE = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safely splits a comma-separated string into a trimmed string array.
 * Returns an empty array for falsy input.
 */
function splitParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Parses a raw search-params object (from Next.js `searchParams`) into a
 * fully-typed `ParsedQuery`. Missing/invalid values fall back to defaults.
 *
 * @example
 * // URL: /products?gender=men&sort=price_asc&page=2
 * parseSearchParams({ gender: "men", sort: "price_asc", page: "2" })
 * // → { gender: ["men"], color: [], size: [], sort: "price_asc", page: 2, ... }
 */
export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): ParsedQuery {
  const raw = qs.stringify(params, { skipNull: true, skipEmptyString: true });
  const parsed = qs.parse(raw);

  const sort = isValidSort(String(parsed.sort ?? ""))
    ? (parsed.sort as SortOption)
    : DEFAULT_SORT;

  const page = parseInt(String(parsed.page ?? "1"), 10);

  const priceMin = parsed.price_min
    ? parseFloat(String(parsed.price_min))
    : undefined;
  const priceMax = parsed.price_max
    ? parseFloat(String(parsed.price_max))
    : undefined;

  return {
    gender: splitParam(String(parsed.gender ?? "")),
    color: splitParam(String(parsed.color ?? "")),
    size: splitParam(String(parsed.size ?? "")),
    priceMin: isNaN(priceMin as number) ? undefined : priceMin,
    priceMax: isNaN(priceMax as number) ? undefined : priceMax,
    sort,
    page: isNaN(page) || page < 1 ? DEFAULT_PAGE : page,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Building / updating query strings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Serialises a `ParsedQuery` back into a URL query string.
 *
 * @example
 * buildQueryString({ gender: ["men"], sort: "newest", page: 1, ... })
 * // → "gender=men&sort=newest"   (page 1 & empty arrays are omitted)
 */
export function buildQueryString(query: Partial<ParsedQuery>): string {
  const params: Record<string, string | undefined> = {};

  if (query.gender?.length) params.gender = query.gender.join(",");
  if (query.color?.length) params.color = query.color.join(",");
  if (query.size?.length) params.size = query.size.join(",");
  if (query.priceMin !== undefined) params.price_min = String(query.priceMin);
  if (query.priceMax !== undefined) params.price_max = String(query.priceMax);
  if (query.sort && query.sort !== DEFAULT_SORT) params.sort = query.sort;
  if (query.page && query.page > 1) params.page = String(query.page);

  return qs.stringify(params, {
    skipNull: true,
    skipEmptyString: true,
    sort: false,
  });
}

/**
 * Toggles a single value within a multi-select filter array.
 * If the value exists it is removed; otherwise it is appended.
 * Always resets page to 1.
 *
 * @example
 * toggleFilterValue({ gender: ["men"], sort: "featured", page: 2, ... }, "gender", "women")
 * // → { gender: ["men", "women"], sort: "featured", page: 1, ... }
 */
export function toggleFilterValue(
  current: ParsedQuery,
  key: keyof ProductFilters,
  value: string
): ParsedQuery {
  const existing = (current[key] as string[]) ?? [];
  const next = existing.includes(value)
    ? existing.filter((v) => v !== value)
    : [...existing, value];

  return { ...current, [key]: next, page: DEFAULT_PAGE };
}

/**
 * Updates the sort param and resets page to 1.
 */
export function setSort(
  current: ParsedQuery,
  sort: SortOption
): ParsedQuery {
  return { ...current, sort, page: DEFAULT_PAGE };
}

/**
 * Sets a price range filter and resets page to 1.
 */
export function setPriceRange(
  current: ParsedQuery,
  min: number | undefined,
  max: number | undefined
): ParsedQuery {
  return { ...current, priceMin: min, priceMax: max, page: DEFAULT_PAGE };
}

/**
 * Removes all active filters; preserves the current sort selection.
 */
export function clearAllFilters(current: ParsedQuery): ParsedQuery {
  return {
    gender: [],
    color: [],
    size: [],
    priceMin: undefined,
    priceMax: undefined,
    sort: current.sort,
    page: DEFAULT_PAGE,
  };
}

/**
 * Returns true when no filter is active.
 */
export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.gender.length > 0 ||
    filters.color.length > 0 ||
    filters.size.length > 0 ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const VALID_SORTS: SortOption[] = [
  "featured",
  "newest",
  "price_desc",
  "price_asc",
];

export function isValidSort(value: string): value is SortOption {
  return VALID_SORTS.includes(value as SortOption);
}

/**
 * Human-readable labels for sort options.
 */
export const SORT_LABELS: Record<SortOption, string> = {
  featured: "Featured",
  newest: "Newest",
  price_desc: "Price: High → Low",
  price_asc: "Price: Low → High",
};
