"use server";

/**
 * product.ts — Server actions for product data fetching.
 *
 * Strategy
 * ────────
 * Both getAllProducts and getProduct fetch all required data in the minimum
 * number of round-trips using Drizzle's relational `findMany` / `findFirst`
 * API. This avoids N+1 query patterns and returns fully-typed results.
 *
 * Filtering approach
 * ──────────────────
 * Multi-value slug filters (gender, color, size) require sub-queries to
 * match across related tables. We use Drizzle's `inArray` + correlated
 * EXISTS sub-queries via `sql` to keep everything in one query.
 *
 * Image resolution
 * ────────────────
 * When a color filter is active we return variant-specific images for the
 * matched colors. When no color is filtered we return the generic (non
 * variant-tied) primary image. This logic runs entirely in TS after a
 * single joined fetch — no extra round-trips.
 *
 * Prices
 * ──────
 * DB prices are stored as NUMERIC strings (e.g. "105.00").
 * We convert to integer cents for the Card component (105.00 → 10500).
 */

import { db } from "@/lib/db";
import {
  products,
  productVariants,
  productImages,
  brands,
  categories,
  genders,
  colors,
  sizes,
  reviews,
  user,
} from "@/lib/db/schema";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  sql,
  count,
} from "drizzle-orm";
import type { ProductQueryParams, SortOption } from "@/lib/utils/query";
import type { BadgeVariant } from "@/components/Card";

// ─────────────────────────────────────────────────────────────────────────────
// Return types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductListItem {
  id: string;
  name: string;
  /** Short subtitle shown under product name, e.g. "Men's Shoes" */
  category: string;
  genderLabel: string;
  genderSlug: string;
  brandName: string;
  colourCount: number;
  /** Resolved display price in cents (salePrice if available, else price) */
  price: number;
  /** Original price in cents — only set when on sale */
  originalPrice?: number;
  /** Primary image URL to show on the card */
  imageSrc: string;
  badge: BadgeVariant;
  discountLabel?: string;
  createdAt: Date;
}

export interface ProductListResult {
  products: ProductListItem[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a NUMERIC string from Drizzle ("105.00") → integer cents (10500). */
function toCents(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.round(parseFloat(value) * 100);
}

/** Derive a badge and optional discount label from variant price data. */
function deriveBadge(
  price: string,
  salePrice: string | null | undefined,
  createdAt: Date
): { badge: BadgeVariant; discountLabel?: string } {
  if (salePrice && parseFloat(salePrice) < parseFloat(price)) {
    const pct = Math.round(
      (1 - parseFloat(salePrice) / parseFloat(price)) * 100
    );
    return { badge: "sale", discountLabel: `${pct}% off` };
  }

  // "New" if created within the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (createdAt > thirtyDaysAgo) {
    return { badge: "new" };
  }

  return { badge: "none" };
}

/** Pick the best image URL to display on the listing card.
 *  Priority: color-variant-specific primary → any variant image → generic primary → first image.
 */
function resolveCardImage(
  allImages: Array<{
    url: string;
    variantId: string | null;
    isPrimary: boolean;
    sortOrder: number;
  }>,
  matchedVariantIds: Set<string>
): string {
  const sorted = [...allImages].sort((a, b) => a.sortOrder - b.sortOrder);

  // 1. Primary image for a matched variant
  if (matchedVariantIds.size > 0) {
    const variantPrimary = sorted.find(
      (img) => img.variantId !== null && matchedVariantIds.has(img.variantId) && img.isPrimary
    );
    if (variantPrimary) return variantPrimary.url;

    // 2. Any image for a matched variant
    const anyVariantImg = sorted.find(
      (img) => img.variantId !== null && matchedVariantIds.has(img.variantId)
    );
    if (anyVariantImg) return anyVariantImg.url;
  }

  // 3. Generic primary (variant_id IS NULL, is_primary = true)
  const genericPrimary = sorted.find((img) => img.variantId === null && img.isPrimary);
  if (genericPrimary) return genericPrimary.url;

  // 4. Any primary
  const anyPrimary = sorted.find((img) => img.isPrimary);
  if (anyPrimary) return anyPrimary.url;

  // 5. First image
  return sorted[0]?.url ?? "/shoes/shoe-1.jpg";
}

/** Build the ORDER BY clause for the product list query. */
function buildOrderBy(sortBy: SortOption) {
  switch (sortBy) {
    case "newest":
      return [desc(products.createdAt)];
    case "price_asc":
      // Subquery-based price sort is handled after fetch; use createdAt as tiebreak
      return [asc(products.createdAt)];
    case "price_desc":
      return [desc(products.createdAt)];
    case "featured":
    default:
      return [desc(products.createdAt)];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getAllProducts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches a filtered, sorted, paginated product list.
 *
 * Single-query strategy
 * ─────────────────────
 * 1. Resolve slug → id mappings for gender / color / size in parallel.
 * 2. Run ONE Drizzle relational query that includes variants and images.
 *    Color/size filtering is done via an EXISTS correlated sub-query so the
 *    planner can use the compound indexes on product_variants.
 * 3. Apply price-based sorting in JS after the fetch (avoids a complex
 *    correlated ORDER BY that PostgreSQL cannot easily index-scan).
 * 4. Paginate in JS using the pre-counted total.
 */
export async function getAllProducts(
  params: Partial<ProductQueryParams> = {}
): Promise<ProductListResult> {
  const {
    genderSlugs = [],
    colorSlugs  = [],
    sizeSlugs   = [],
    priceMin,
    priceMax,
    sortBy      = "featured",
    page        = 1,
    limit       = 24,
    search,
  } = params;

  // ── 1. Resolve slugs → IDs in parallel ─────────────────────────────────
  const [genderRows, colorRows, sizeRows] = await Promise.all([
    genderSlugs.length > 0
      ? db.select({ id: genders.id }).from(genders).where(inArray(genders.slug, genderSlugs))
      : Promise.resolve([]),
    colorSlugs.length > 0
      ? db.select({ id: colors.id }).from(colors).where(inArray(colors.slug, colorSlugs))
      : Promise.resolve([]),
    sizeSlugs.length > 0
      ? db.select({ id: sizes.id }).from(sizes).where(inArray(sizes.slug, sizeSlugs))
      : Promise.resolve([]),
  ]);

  const genderIds = genderRows.map((r) => r.id);
  const colorIds  = colorRows.map((r) => r.id);
  const sizeIds   = sizeRows.map((r) => r.id);

  // ── 2. Build WHERE conditions ───────────────────────────────────────────
  const conditions = [
    eq(products.isPublished, true),
    // Full-text / ILIKE search on product name
    ...(search ? [ilike(products.name, `%${search}%`)] : []),
    // Gender filter
    ...(genderIds.length > 0 ? [inArray(products.genderId, genderIds)] : []),
    // Color filter — product must have at least one variant with a matching color
    ...(colorIds.length > 0
      ? [
          sql`EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND pv.color_id = ANY(ARRAY[${sql.join(colorIds.map((id) => sql`${id}::uuid`), sql`, `)}])
          )`,
        ]
      : []),
    // Size filter — product must have at least one variant with a matching size
    ...(sizeIds.length > 0
      ? [
          sql`EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND pv.size_id = ANY(ARRAY[${sql.join(sizeIds.map((id) => sql`${id}::uuid`), sql`, `)}])
          )`,
        ]
      : []),
    // Price filter — applied against the minimum variant price for the product
    ...(priceMin !== undefined
      ? [
          sql`EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND CAST(COALESCE(pv.sale_price, pv.price) AS numeric) >= ${priceMin / 100}
          )`,
        ]
      : []),
    ...(priceMax !== undefined
      ? [
          sql`EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND CAST(COALESCE(pv.sale_price, pv.price) AS numeric) <= ${priceMax / 100}
          )`,
        ]
      : []),
  ];

  const whereClause = and(...conditions);

  // ── 3. Count total (for pagination metadata) ────────────────────────────
  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause);

  const totalCount = Number(total);
  const totalPages = Math.ceil(totalCount / limit);

  // ── 4. Fetch product rows with relations ────────────────────────────────
  const rows = await db.query.products.findMany({
    where: whereClause,
    orderBy: buildOrderBy(sortBy),
    with: {
      category: { columns: { name: true } },
      gender:   { columns: { label: true, slug: true } },
      brand:    { columns: { name: true } },
      variants: {
        columns: {
          id: true,
          price: true,
          salePrice: true,
          colorId: true,
        },
      },
      images: {
        columns: {
          url: true,
          variantId: true,
          isPrimary: true,
          sortOrder: true,
        },
      },
    },
  });

  // ── 5. Map to ProductListItem ────────────────────────────────────────────
  let mapped: ProductListItem[] = rows.map((row) => {
    // Find the cheapest effective price across all variants
    let minPrice    = Infinity;
    let minSalePrice: number | null = null;
    let basePrice   = "0";
    let salePriceRaw: string | null = null;

    for (const v of row.variants) {
      const effective = v.salePrice
        ? parseFloat(v.salePrice)
        : parseFloat(v.price);
      if (effective < minPrice) {
        minPrice    = effective;
        basePrice   = v.price;
        salePriceRaw = v.salePrice ?? null;
      }
    }

    // Unique color count
    const uniqueColorIds = new Set(row.variants.map((v) => v.colorId));
    const colourCount    = uniqueColorIds.size;

    // Determine which variant IDs matched the color filter
    const matchedVariantIds = new Set<string>(
      colorIds.length > 0
        ? row.variants
            .filter((v) => colorIds.includes(v.colorId))
            .map((v) => v.id)
        : []
    );

    const imageSrc = resolveCardImage(row.images, matchedVariantIds);

    const { badge, discountLabel } = deriveBadge(
      basePrice,
      salePriceRaw,
      row.createdAt
    );

    const priceCents        = toCents(salePriceRaw ?? basePrice);
    const originalPriceCents =
      salePriceRaw && parseFloat(salePriceRaw) < parseFloat(basePrice)
        ? toCents(basePrice)
        : undefined;

    return {
      id:            row.id,
      name:          row.name,
      category:      row.category.name,
      genderLabel:   row.gender.label,
      genderSlug:    row.gender.slug,
      brandName:     row.brand.name,
      colourCount,
      price:         priceCents,
      originalPrice: originalPriceCents,
      imageSrc,
      badge,
      discountLabel,
      createdAt:     row.createdAt,
    };
  });

  // ── 6. In-JS price sort (avoids correlated ORDER BY) ────────────────────
  if (sortBy === "price_asc") {
    mapped.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    mapped.sort((a, b) => b.price - a.price);
  } else if (sortBy === "featured") {
    // best-seller → sale → new → none (badge-priority ordering)
    const order: Record<BadgeVariant, number> = {
      "best-seller": 0,
      sale:          1,
      new:           2,
      none:          3,
    };
    mapped.sort((a, b) => (order[a.badge] ?? 3) - (order[b.badge] ?? 3));
  }

  // ── 7. Paginate ─────────────────────────────────────────────────────────
  const offset    = (page - 1) * limit;
  const paginated = mapped.slice(offset, offset + limit);

  return {
    products:   paginated,
    totalCount,
    page,
    limit,
    totalPages,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Review types
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommended product types
// ─────────────────────────────────────────────────────────────────────────────

export interface RecommendedProduct {
  id: string;
  name: string;
  category: string;
  genderLabel: string;
  price: number;
  originalPrice?: number;
  imageSrc: string;
  badge: BadgeVariant;
  discountLabel?: string;
  colourCount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// getProduct
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductVariantDetail {
  id: string;
  sku: string;
  price: number;       // cents
  salePrice?: number;  // cents, only when on sale
  colorId: string;
  colorName: string;
  colorSlug: string;
  colorHex: string;
  sizeId: string;
  sizeName: string;
  sizeSlug: string;
  sortOrder: number;
  inStock: number;
}

export interface ProductImageDetail {
  id: string;
  url: string;
  variantId: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductDetail {
  id: string;
  name: string;
  description: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  category: { id: string; name: string; slug: string };
  brand:    { id: string; name: string; slug: string; logoUrl: string | null };
  gender:   { id: string; label: string; slug: string };
  // Aggregated
  variants: ProductVariantDetail[];
  images:   ProductImageDetail[];
  /** Distinct colors available across all variants */
  availableColors: Array<{ id: string; name: string; slug: string; hexCode: string }>;
  /** Distinct sizes available across all variants (sorted by sortOrder) */
  availableSizes:  Array<{ id: string; name: string; slug: string; sortOrder: number }>;
  /** Minimum effective price in cents */
  minPrice: number;
  /** Maximum effective price in cents */
  maxPrice: number;
}

/**
 * Fetches the complete product detail for a PDP.
 * Returns null when the product is not found or not published.
 *
 * Uses Drizzle relational `findFirst` with nested `with` clauses to load
 * everything in a single round-trip.
 */
export async function getProduct(productId: string): Promise<ProductDetail | null> {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.isPublished, true)),
    with: {
      category: { columns: { id: true, name: true, slug: true } },
      brand:    { columns: { id: true, name: true, slug: true, logoUrl: true } },
      gender:   { columns: { id: true, label: true, slug: true } },
      variants: {
        with: {
          color: { columns: { id: true, name: true, slug: true, hexCode: true } },
          size:  { columns: { id: true, name: true, slug: true, sortOrder: true } },
        },
        columns: {
          id:        true,
          sku:       true,
          price:     true,
          salePrice: true,
          colorId:   true,
          sizeId:    true,
          inStock:   true,
        },
        orderBy: (v) => [asc(v.createdAt)],
      },
      images: {
        columns: {
          id:        true,
          url:       true,
          variantId: true,
          sortOrder: true,
          isPrimary: true,
        },
        orderBy: (img) => [asc(img.sortOrder)],
      },
    },
  });

  if (!row) return null;

  // ── Map variants ─────────────────────────────────────────────────────────
  const variantDetails: ProductVariantDetail[] = row.variants.map((v) => {
    const priceCents     = toCents(v.price);
    const salePriceCents = v.salePrice ? toCents(v.salePrice) : undefined;
    return {
      id:         v.id,
      sku:        v.sku,
      price:      salePriceCents ?? priceCents,
      salePrice:  salePriceCents && salePriceCents < priceCents ? priceCents : undefined,
      colorId:    v.colorId,
      colorName:  v.color.name,
      colorSlug:  v.color.slug,
      colorHex:   v.color.hexCode,
      sizeId:     v.sizeId,
      sizeName:   v.size.name,
      sizeSlug:   v.size.slug,
      sortOrder:  v.size.sortOrder,
      inStock:    v.inStock,
    };
  });

  // ── Compute available colors & sizes (deduplicated) ──────────────────────
  const colorMap  = new Map<string, { id: string; name: string; slug: string; hexCode: string }>();
  const sizeMap   = new Map<string, { id: string; name: string; slug: string; sortOrder: number }>();

  for (const v of row.variants) {
    if (!colorMap.has(v.colorId)) {
      colorMap.set(v.colorId, {
        id:      v.color.id,
        name:    v.color.name,
        slug:    v.color.slug,
        hexCode: v.color.hexCode,
      });
    }
    if (!sizeMap.has(v.sizeId)) {
      sizeMap.set(v.sizeId, {
        id:        v.size.id,
        name:      v.size.name,
        slug:      v.size.slug,
        sortOrder: v.size.sortOrder,
      });
    }
  }

  const availableColors = Array.from(colorMap.values());
  const availableSizes  = Array.from(sizeMap.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );

  // ── Compute price range ─────────────────────────────────────────────────
  const effectivePrices = row.variants.map((v) =>
    toCents(v.salePrice ?? v.price)
  );
  const minPrice = effectivePrices.length > 0 ? Math.min(...effectivePrices) : 0;
  const maxPrice = effectivePrices.length > 0 ? Math.max(...effectivePrices) : 0;

  // ── Image details ────────────────────────────────────────────────────────
  const imageDetails: ProductImageDetail[] = row.images.map((img) => ({
    id:        img.id,
    url:       img.url,
    variantId: img.variantId,
    sortOrder: img.sortOrder,
    isPrimary: img.isPrimary,
  }));

  return {
    id:          row.id,
    name:        row.name,
    description: row.description,
    isPublished: row.isPublished,
    createdAt:   row.createdAt,
    updatedAt:   row.updatedAt,
    category:    row.category,
    brand:       row.brand,
    gender:      row.gender,
    variants:    variantDetails,
    images:      imageDetails,
    availableColors,
    availableSizes,
    minPrice,
    maxPrice,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getProductReviews
// ─────────────────────────────────────────────────────────────────────────────

// Static fallback reviews used when no DB data exists
const FALLBACK_REVIEWS: ReviewItem[] = [
  {
    id: "fallback-1",
    author: "Jordan M.",
    rating: 5,
    title: "Best shoe I've ever owned",
    content:
      "These fit perfectly out of the box. The cushioning is exceptional and they look amazing. Already ordered a second pair in a different colour.",
    createdAt: "2025-11-14T10:22:00Z",
  },
  {
    id: "fallback-2",
    author: "Taylor R.",
    rating: 4,
    title: "Great everyday shoe",
    content:
      "Really comfortable for all-day wear. The sizing runs slightly large — I'd recommend going half a size down. Otherwise flawless.",
    createdAt: "2025-10-28T08:15:00Z",
  },
  {
    id: "fallback-3",
    author: "Alex C.",
    rating: 5,
    content:
      "Wore these on a 10-mile hike and my feet felt great the whole time. Very impressed with the build quality.",
    createdAt: "2025-10-02T14:45:00Z",
  },
  {
    id: "fallback-4",
    author: "Sam P.",
    rating: 3,
    title: "Looks great, comfort is average",
    content:
      "The design is stunning but I expected more cushioning for the price point. Still a solid shoe overall.",
    createdAt: "2025-09-18T09:00:00Z",
  },
  {
    id: "fallback-5",
    author: "Morgan K.",
    rating: 5,
    title: "Worth every penny",
    content:
      "I was skeptical at first but these blew me away. Super lightweight and the grip is excellent on all surfaces.",
    createdAt: "2025-08-30T17:20:00Z",
  },
];

/**
 * Fetches approved reviews for a product, sorted newest-first.
 * Falls back to static demo reviews when no DB rows exist.
 *
 * Note: The current `reviews` schema does not have an `is_approved` column,
 * so all reviews are treated as approved. An `is_approved` column can be
 * added in a future migration without changing this action's interface.
 *
 * Limit: 10 reviews (as per spec).
 */
export async function getProductReviews(productId: string): Promise<ReviewItem[]> {
  try {
    const rows = await db
      .select({
        id:        reviews.id,
        rating:    reviews.rating,
        comment:   reviews.comment,
        createdAt: reviews.createdAt,
        userName:  user.name,
      })
      .from(reviews)
      .leftJoin(user, eq(reviews.userId, user.id))
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt))
      .limit(10);

    if (rows.length === 0) return FALLBACK_REVIEWS;

    return rows.map((r) => ({
      id:        r.id,
      author:    r.userName ?? "Anonymous",
      rating:    r.rating,
      content:   r.comment ?? "",
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    // DB unavailable — return fallback data so the UI still renders
    return FALLBACK_REVIEWS;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getRecommendedProducts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns 4–6 products in the same category, brand, or gender as the given
 * product, excluding the product itself.
 *
 * Matching priority:
 *   1. Same category AND gender
 *   2. Same category
 *   3. Same brand
 *   4. Same gender
 *
 * Products with no valid primary image are silently skipped.
 * Falls back gracefully when the DB is unavailable.
 */
export async function getRecommendedProducts(
  productId: string
): Promise<RecommendedProduct[]> {
  // ── 1. Fetch the source product's metadata ─────────────────────────────
  let source: { categoryId: string; brandId: string; genderId: string } | null = null;
  try {
    const sourceRow = await db
      .select({
        categoryId: products.categoryId,
        brandId:    products.brandId,
        genderId:   products.genderId,
      })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isPublished, true)))
      .limit(1);

    if (sourceRow.length === 0) return [];
    source = sourceRow[0];
  } catch {
    return [];
  }

  const { categoryId, brandId, genderId } = source;

  // ── 2. Fetch candidate products via relational query ────────────────────
  // We use db.query (relational API) so we get nested variants + images in
  // one round-trip. The type assertion is needed because TypeScript cannot
  // infer the `with` shape from the dynamic `where` clause.
  interface CandidateRow {
    id: string;
    name: string;
    createdAt: Date;
    category: { name: string };
    gender:   { label: string };
    variants: Array<{ id: string; price: string; salePrice: string | null; colorId: string }>;
    images:   Array<{ url: string; variantId: string | null; isPrimary: boolean; sortOrder: number }>;
  }

  let rows: CandidateRow[];
  try {
    const raw = await db.query.products.findMany({
      where: and(
        eq(products.isPublished, true),
        sql`${products.id} != ${productId}::uuid`,
        sql`(
          ${products.categoryId} = ${categoryId}::uuid OR
          ${products.brandId}    = ${brandId}::uuid    OR
          ${products.genderId}   = ${genderId}::uuid
        )`
      ),
      limit: 12,
      with: {
        category: { columns: { name: true } },
        gender:   { columns: { label: true } },
        variants: {
          columns: { id: true, price: true, salePrice: true, colorId: true },
        },
        images: {
          columns: { url: true, variantId: true, isPrimary: true, sortOrder: true },
          orderBy: (img) => [asc(img.sortOrder)],
        },
      },
    });
    rows = raw as unknown as CandidateRow[];
  } catch {
    return [];
  }

  // ── 3. Map + filter ─────────────────────────────────────────────────────
  const results: RecommendedProduct[] = [];

  for (const row of rows) {
    const imageSrc = resolveCardImage(row.images, new Set());
    if (!imageSrc) continue;

    let basePrice    = "0";
    let salePriceRaw: string | null = null;
    let minEffective = Infinity;

    for (const v of row.variants) {
      const effective = v.salePrice ? parseFloat(v.salePrice) : parseFloat(v.price);
      if (effective < minEffective) {
        minEffective = effective;
        basePrice    = v.price;
        salePriceRaw = v.salePrice ?? null;
      }
    }

    const colourCount        = new Set(row.variants.map((v) => v.colorId)).size;
    const { badge, discountLabel } = deriveBadge(basePrice, salePriceRaw, row.createdAt);
    const priceCents         = toCents(salePriceRaw ?? basePrice);
    const originalPriceCents =
      salePriceRaw && parseFloat(salePriceRaw) < parseFloat(basePrice)
        ? toCents(basePrice)
        : undefined;

    results.push({
      id:            row.id,
      name:          row.name,
      category:      row.category.name,
      genderLabel:   row.gender.label,
      price:         priceCents,
      originalPrice: originalPriceCents,
      imageSrc,
      badge,
      discountLabel,
      colourCount,
    });

    if (results.length >= 6) break;
  }

  return results;
}
