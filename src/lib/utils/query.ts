import qs from "query-string";

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
  limit: number;
  search?: string;
}

export interface ProductQueryParams {
  genderSlugs: string[];
  colorSlugs: string[];
  sizeSlugs: string[];
  priceMin?: number;
  priceMax?: number;
  sortBy: SortOption;
  page: number;
  limit: number;
  search?: string;
}

export const DEFAULT_SORT: SortOption = "featured";
export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 24;

function splitParam(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parseSearchParams(
  params: Record<string, string | string[] | undefined>
): ParsedQuery {
  const raw    = qs.stringify(params, { skipNull: true, skipEmptyString: true });
  const parsed = qs.parse(raw);

  const sort = isValidSort(String(parsed.sort ?? ""))
    ? (parsed.sort as SortOption)
    : DEFAULT_SORT;

  const page  = parseInt(String(parsed.page  ?? "1"), 10);
  const limit = parseInt(String(parsed.limit ?? String(DEFAULT_LIMIT)), 10);

  const priceMin = parsed.price_min
    ? parseFloat(String(parsed.price_min))
    : undefined;
  const priceMax = parsed.price_max
    ? parseFloat(String(parsed.price_max))
    : undefined;

  const search = parsed.search ? String(parsed.search).trim() : undefined;

  return {
    gender:   splitParam(String(parsed.gender ?? "")),
    color:    splitParam(String(parsed.color  ?? "")),
    size:     splitParam(String(parsed.size   ?? "")),
    priceMin: isNaN(priceMin as number) ? undefined : priceMin,
    priceMax: isNaN(priceMax as number) ? undefined : priceMax,
    sort,
    page:  isNaN(page)  || page  < 1 ? DEFAULT_PAGE  : page,
    limit: isNaN(limit) || limit < 1 ? DEFAULT_LIMIT : Math.min(limit, 100),
    search: search || undefined,
  };
}

export function parseFilterParams(
  searchParams: Record<string, string | string[] | undefined>
): ProductQueryParams {
  const parsed = parseSearchParams(searchParams);
  return buildProductQueryObject(parsed);
}

export function buildProductQueryObject(
  parsed: ParsedQuery
): ProductQueryParams {
  return {
    genderSlugs: parsed.gender,
    colorSlugs:  parsed.color,
    sizeSlugs:   parsed.size,
    priceMin:    parsed.priceMin,
    priceMax:    parsed.priceMax,
    sortBy:      parsed.sort,
    page:        parsed.page,
    limit:       parsed.limit,
    search:      parsed.search,
  };
}

export function buildQueryString(query: Partial<ParsedQuery>): string {
  const params: Record<string, string | undefined> = {};

  if (query.gender?.length) params.gender = query.gender.join(",");
  if (query.color?.length)  params.color  = query.color.join(",");
  if (query.size?.length)   params.size   = query.size.join(",");
  if (query.priceMin !== undefined) params.price_min = String(query.priceMin);
  if (query.priceMax !== undefined) params.price_max = String(query.priceMax);
  if (query.sort && query.sort !== DEFAULT_SORT) params.sort = query.sort;
  if (query.page  && query.page  > 1) params.page = String(query.page);
  if (query.limit && query.limit !== DEFAULT_LIMIT) params.limit = String(query.limit);
  if (query.search) params.search = query.search;

  return qs.stringify(params, {
    skipNull: true,
    skipEmptyString: true,
    sort: false,
  });
}

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

export function setSort(
  current: ParsedQuery,
  sort: SortOption
): ParsedQuery {
  return { ...current, sort, page: DEFAULT_PAGE };
}

export function setPriceRange(
  current: ParsedQuery,
  min: number | undefined,
  max: number | undefined
): ParsedQuery {
  return { ...current, priceMin: min, priceMax: max, page: DEFAULT_PAGE };
}

export function clearAllFilters(current: ParsedQuery): ParsedQuery {
  return {
    gender:   [],
    color:    [],
    size:     [],
    priceMin: undefined,
    priceMax: undefined,
    sort:     current.sort,
    page:     DEFAULT_PAGE,
    limit:    current.limit,
    search:   undefined,
  };
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.gender.length > 0 ||
    filters.color.length  > 0 ||
    filters.size.length   > 0 ||
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined
  );
}

const VALID_SORTS: SortOption[] = [
  "featured",
  "newest",
  "price_desc",
  "price_asc",
];

export function isValidSort(value: string): value is SortOption {
  return VALID_SORTS.includes(value as SortOption);
}

export const SORT_LABELS: Record<SortOption, string> = {
  featured:   "Featured",
  newest:     "Newest",
  price_desc: "Price: High → Low",
  price_asc:  "Price: Low → High",
};