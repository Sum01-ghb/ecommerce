"use server";

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

export interface ProductListItem {
  id: string;
  name: string;

  category: string;
  genderLabel: string;
  genderSlug: string;
  brandName: string;
  colourCount: number;

  price: number;

  originalPrice?: number;

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

function toCents(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.round(parseFloat(value) * 100);
}

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

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  if (createdAt > thirtyDaysAgo) {
    return { badge: "new" };
  }

  return { badge: "none" };
}

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

  if (matchedVariantIds.size > 0) {
    const variantPrimary = sorted.find(
      (img) => img.variantId !== null && matchedVariantIds.has(img.variantId) && img.isPrimary
    );
    if (variantPrimary) return variantPrimary.url;

    const anyVariantImg = sorted.find(
      (img) => img.variantId !== null && matchedVariantIds.has(img.variantId)
    );
    if (anyVariantImg) return anyVariantImg.url;
  }

  const genericPrimary = sorted.find((img) => img.variantId === null && img.isPrimary);
  if (genericPrimary) return genericPrimary.url;

  const anyPrimary = sorted.find((img) => img.isPrimary);
  if (anyPrimary) return anyPrimary.url;

  return sorted[0]?.url ?? "/shoes/shoe-1.jpg";
}

function buildOrderBy(sortBy: SortOption) {
  switch (sortBy) {
    case "newest":
      return [desc(products.createdAt)];
    case "price_asc":

      return [asc(products.createdAt)];
    case "price_desc":
      return [desc(products.createdAt)];
    case "featured":
    default:
      return [desc(products.createdAt)];
  }
}

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

  const conditions = [
    eq(products.isPublished, true),

    ...(search ? [ilike(products.name, `%${search}%`)] : []),

    ...(genderIds.length > 0 ? [inArray(products.genderId, genderIds)] : []),

    ...(colorIds.length > 0
      ? [
          sql`EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND pv.color_id = ANY(ARRAY[${sql.join(colorIds.map((id) => sql`${id}::uuid`), sql`, `)}])
          )`,
        ]
      : []),

    ...(sizeIds.length > 0
      ? [
          sql`EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.product_id = ${products.id}
              AND pv.size_id = ANY(ARRAY[${sql.join(sizeIds.map((id) => sql`${id}::uuid`), sql`, `)}])
          )`,
        ]
      : []),

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

  const [{ total }] = await db
    .select({ total: count() })
    .from(products)
    .where(whereClause);

  const totalCount = Number(total);
  const totalPages = Math.ceil(totalCount / limit);

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

  let mapped: ProductListItem[] = rows.map((row) => {

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

    const uniqueColorIds = new Set(row.variants.map((v) => v.colorId));
    const colourCount    = uniqueColorIds.size;

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

  if (sortBy === "price_asc") {
    mapped.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    mapped.sort((a, b) => b.price - a.price);
  } else if (sortBy === "featured") {

    const order: Record<BadgeVariant, number> = {
      "best-seller": 0,
      sale:          1,
      new:           2,
      none:          3,
    };
    mapped.sort((a, b) => (order[a.badge] ?? 3) - (order[b.badge] ?? 3));
  }

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

export interface ReviewItem {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
}

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

export interface ProductVariantDetail {
  id: string;
  sku: string;
  price: number;       
  salePrice?: number;  
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

  category: { id: string; name: string; slug: string };
  brand:    { id: string; name: string; slug: string; logoUrl: string | null };
  gender:   { id: string; label: string; slug: string };

  variants: ProductVariantDetail[];
  images:   ProductImageDetail[];

  availableColors: Array<{ id: string; name: string; slug: string; hexCode: string }>;

  availableSizes:  Array<{ id: string; name: string; slug: string; sortOrder: number }>;

  minPrice: number;

  maxPrice: number;
}

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

  const effectivePrices = row.variants.map((v) =>
    toCents(v.salePrice ?? v.price)
  );
  const minPrice = effectivePrices.length > 0 ? Math.min(...effectivePrices) : 0;
  const maxPrice = effectivePrices.length > 0 ? Math.max(...effectivePrices) : 0;

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

    return FALLBACK_REVIEWS;
  }
}

export async function getRecommendedProducts(
  productId: string
): Promise<RecommendedProduct[]> {

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