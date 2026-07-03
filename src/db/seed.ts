/**
 * seed.ts — Populates the database with realistic Nike product data.
 *
 * Run with:  npm run db:seed
 *
 * What it seeds
 * ─────────────
 *  • 1 brand   : Nike
 *  • 4 genders : Men, Women, Kids, Unisex
 *  • 6 colors  : White, Black, Red, Blue, Grey, Green
 *  • 8 sizes   : US 6–13 (shoe sizes)
 *  • 4 categories: Footwear > Lifestyle / Running / Basketball / Trail
 *  • 2 collections: Summer '25, Classics
 *  • 15 Nike products with realistic variants, images, and collection links
 *
 * Images are copied from public/shoes/ → static/uploads/ so the app can
 * serve them as static assets without needing a CDN.
 */

import "dotenv/config";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  brands,
  genders,
  colors,
  sizes,
  categories,
  collections,
  products,
  productVariants,
  productImages,
  productCollections,
} from "./index";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany<T>(arr: T[], min = 1, max?: number): T[] {
  const upper = max ?? arr.length;
  const count = Math.floor(Math.random() * (upper - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Resolve a public-folder image path to the URL that Next.js / Vercel will serve.
 *
 * Images live in public/shoes/ and are committed to the repo, so they are
 * always available at /shoes/<filename> on any deployment — no file-copy needed.
 *
 * Example: "public/shoes/shoe-1.jpg" → "/shoes/shoe-1.jpg"
 */
function resolveImageUrl(srcRelative: string): string {
  // Strip the leading "public" segment so the URL is relative to the web root
  const withoutPublic = srcRelative.replace(/^public\//, "");
  return `/${withoutPublic}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Static data definitions
// ─────────────────────────────────────────────────────────────────────────────

const BRAND_ID      = uuidv4();
const GENDER_IDS    = { men: uuidv4(), women: uuidv4(), kids: uuidv4(), unisex: uuidv4() };
const COLOR_IDS     = {
  white: uuidv4(), black: uuidv4(), red: uuidv4(),
  blue: uuidv4(),  grey: uuidv4(),  green: uuidv4(),
};
const SIZE_IDS      = {
  us6: uuidv4(), us7: uuidv4(), us8: uuidv4(), us9: uuidv4(),
  us10: uuidv4(), us11: uuidv4(), us12: uuidv4(), us13: uuidv4(),
};
const CAT_IDS       = {
  footwear: uuidv4(),
  lifestyle: uuidv4(),
  running: uuidv4(),
  basketball: uuidv4(),
  trail: uuidv4(),
};
const COLLECTION_IDS = { summer25: uuidv4(), classics: uuidv4() };

// ─────────────────────────────────────────────────────────────────────────────
// Seed row builders
// ─────────────────────────────────────────────────────────────────────────────

const brandRows = [
  { id: BRAND_ID, name: "Nike", slug: "nike", logoUrl: "/static/uploads/brands/nike-logo.svg" },
];

const genderRows = [
  { id: GENDER_IDS.men,    label: "Men",    slug: "men" },
  { id: GENDER_IDS.women,  label: "Women",  slug: "women" },
  { id: GENDER_IDS.kids,   label: "Kids",   slug: "kids" },
  { id: GENDER_IDS.unisex, label: "Unisex", slug: "unisex" },
];

const colorRows = [
  { id: COLOR_IDS.white, name: "White", slug: "white", hexCode: "#FFFFFF" },
  { id: COLOR_IDS.black, name: "Black", slug: "black", hexCode: "#000000" },
  { id: COLOR_IDS.red,   name: "Red",   slug: "red",   hexCode: "#FF0000" },
  { id: COLOR_IDS.blue,  name: "Blue",  slug: "blue",  hexCode: "#0000FF" },
  { id: COLOR_IDS.grey,  name: "Grey",  slug: "grey",  hexCode: "#808080" },
  { id: COLOR_IDS.green, name: "Green", slug: "green", hexCode: "#008000" },
];

const sizeRows = [
  { id: SIZE_IDS.us6,  name: "US 6",  slug: "us-6",  sortOrder: 1 },
  { id: SIZE_IDS.us7,  name: "US 7",  slug: "us-7",  sortOrder: 2 },
  { id: SIZE_IDS.us8,  name: "US 8",  slug: "us-8",  sortOrder: 3 },
  { id: SIZE_IDS.us9,  name: "US 9",  slug: "us-9",  sortOrder: 4 },
  { id: SIZE_IDS.us10, name: "US 10", slug: "us-10", sortOrder: 5 },
  { id: SIZE_IDS.us11, name: "US 11", slug: "us-11", sortOrder: 6 },
  { id: SIZE_IDS.us12, name: "US 12", slug: "us-12", sortOrder: 7 },
  { id: SIZE_IDS.us13, name: "US 13", slug: "us-13", sortOrder: 8 },
];

const categoryRows = [
  { id: CAT_IDS.footwear,   name: "Footwear",    slug: "footwear",    parentId: null },
  { id: CAT_IDS.lifestyle,  name: "Lifestyle",   slug: "lifestyle",   parentId: CAT_IDS.footwear },
  { id: CAT_IDS.running,    name: "Running",     slug: "running",     parentId: CAT_IDS.footwear },
  { id: CAT_IDS.basketball, name: "Basketball",  slug: "basketball",  parentId: CAT_IDS.footwear },
  { id: CAT_IDS.trail,      name: "Trail",       slug: "trail",       parentId: CAT_IDS.running },
];

const collectionRows = [
  { id: COLLECTION_IDS.summer25, name: "Summer '25",   slug: "summer-25" },
  { id: COLLECTION_IDS.classics, name: "Classics",     slug: "classics" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Product catalogue
// ─────────────────────────────────────────────────────────────────────────────

interface ProductSeed {
  name: string;
  description: string;
  categoryId: string;
  genderId: string;
  basePrice: string;
  image: string;        // relative to public/
  extraImages?: string[];
  collectionId?: string;
}

const productSeeds: ProductSeed[] = [
  {
    name: "Nike Air Force 1 Mid '07",
    description:
      "The radiance lives on in the Nike Air Force 1 '07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash to ease it from a crisp morning to a laid-back afternoon.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.men,
    basePrice: "105.00",
    image: "public/shoes/shoe-1.jpg",
    collectionId: COLLECTION_IDS.classics,
  },
  {
    name: "Nike Court Vision Low Next Nature",
    description:
      "Born from the hardwood and built for the streets. The Nike Court Vision Low Next Nature uses at least 20% recycled content by weight, so you can look good and feel good about it.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.women,
    basePrice: "80.00",
    image: "public/shoes/shoe-2.webp",
    collectionId: COLLECTION_IDS.summer25,
  },
  {
    name: "Nike Dunk Low Premium",
    description:
      "Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colors. This basketball icon channels '80s vibes with a modern twist.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.unisex,
    basePrice: "110.00",
    image: "public/shoes/shoe-3.webp",
    collectionId: COLLECTION_IDS.classics,
  },
  {
    name: "Nike Air Max 270",
    description:
      "Featuring Nike's first lifestyle Air unit, the Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort, it nods to the original 1991 Air Max 180.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.men,
    basePrice: "150.00",
    image: "public/shoes/shoe-4.webp",
    extraImages: ["public/shoes/shoe-5.avif"],
    collectionId: COLLECTION_IDS.summer25,
  },
  {
    name: "Nike Pegasus 41",
    description:
      "Responsive cushioning in the Pegasus provides an energized ride for everyday road running. Experience lightweight energy return with dual ReactX foam technology that delivers 13% more energy return than its predecessor.",
    categoryId: CAT_IDS.running,
    genderId: GENDER_IDS.men,
    basePrice: "140.00",
    image: "public/shoes/shoe-5.avif",
    collectionId: COLLECTION_IDS.summer25,
  },
  {
    name: "Air Jordan 1 Retro High OG",
    description:
      "Familiar but always fresh, the iconic Air Jordan 1 is remastered for today's sneakerhead culture. This Retro High OG edition features premium leather, visible Air-Sole unit, and a colour-blocked upper.",
    categoryId: CAT_IDS.basketball,
    genderId: GENDER_IDS.men,
    basePrice: "180.00",
    image: "public/shoes/shoe-6.avif",
    collectionId: COLLECTION_IDS.classics,
  },
  {
    name: "Nike ZoomX Vaporfly Next% 3",
    description:
      "Catch 'em if you can. Giving you race-day speed to conquer any distance, the ZoomX Vaporfly Next% 3 uses an updated ZoomX foam formula and a new mesh upper for a smoother, more comfortable fit.",
    categoryId: CAT_IDS.running,
    genderId: GENDER_IDS.unisex,
    basePrice: "260.00",
    image: "public/shoes/shoe-7.avif",
  },
  {
    name: "Nike React Presto",
    description:
      "The Nike React Presto blends innovation with a bold look. React foam gives a smooth, comfortable ride for everyday life, while an elastic upper hugs your foot for a sock-like snug fit.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.men,
    basePrice: "130.00",
    image: "public/shoes/shoe-8.avif",
    collectionId: COLLECTION_IDS.summer25,
  },
  {
    name: "Nike Air Max 97",
    description:
      "The iconic wavy lines of the Nike Air Max 97 are inspired by bullet trains and Japanese water ripples. Full-length Nike Air cushioning gives you a smooth, comfortable ride in a sleek, retro silhouette.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.unisex,
    basePrice: "175.00",
    image: "public/shoes/shoe-9.avif",
    collectionId: COLLECTION_IDS.classics,
  },
  {
    name: "Nike Invincible 3",
    description:
      "The Nike Invincible 3 will keep you on the run. Our softest ZoomX foam cushioning yet provides an ultra-plush feel with every step, keeping you going mile after mile without sacrificing responsiveness.",
    categoryId: CAT_IDS.running,
    genderId: GENDER_IDS.women,
    basePrice: "190.00",
    image: "public/shoes/shoe-10.avif",
    collectionId: COLLECTION_IDS.summer25,
  },
  {
    name: "Nike Air Zoom Pegasus Trail 4",
    description:
      "Hit the trail with the Nike Air Zoom Pegasus Trail 4. Whether you're on gravel paths or light technical terrain, this shoe gives you the responsiveness, traction and protection you need to keep moving.",
    categoryId: CAT_IDS.trail,
    genderId: GENDER_IDS.men,
    basePrice: "160.00",
    image: "public/shoes/shoe-11.avif",
  },
  {
    name: "Nike Blazer Mid '77 Vintage",
    description:
      "Inspired by Nike's earliest forays into basketball, the Nike Blazer Mid '77 Vintage brings back the look of the '70s with a high-stacked foxing, vintage styling, crinkled leather and a retro finish.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.unisex,
    basePrice: "100.00",
    image: "public/shoes/shoe-12.avif",
    collectionId: COLLECTION_IDS.classics,
  },
  {
    name: "Nike Free Run 5.0",
    description:
      "Experience natural motion with the Nike Free Run 5.0. The flexible sole expands and contracts with your foot so every stride feels fluid and unrestricted. Perfect for easy runs and cross-training days.",
    categoryId: CAT_IDS.running,
    genderId: GENDER_IDS.women,
    basePrice: "120.00",
    image: "public/shoes/shoe-13.avif",
    collectionId: COLLECTION_IDS.summer25,
  },
  {
    name: "Nike Air Huarache",
    description:
      "The Nike Air Huarache fuses its 1991 roots with modern performance. A neoprene inner sleeve and lightweight outer shell work together to deliver a snug fit and a distinct, dynamic look.",
    categoryId: CAT_IDS.lifestyle,
    genderId: GENDER_IDS.men,
    basePrice: "130.00",
    image: "public/shoes/shoe-14.avif",
    collectionId: COLLECTION_IDS.classics,
  },
  {
    name: "Nike Revolution 7",
    description:
      "Start your running journey with the Nike Revolution 7. Lightweight cushioning delivers a smooth feel mile after mile, while the breathable mesh upper keeps you comfortable on every run.",
    categoryId: CAT_IDS.running,
    genderId: GENDER_IDS.kids,
    basePrice: "75.00",
    image: "public/shoes/shoe-15.avif",
    collectionId: COLLECTION_IDS.summer25,
  },
];

// Map colour pools per gender to keep seed data realistic
const GENDER_COLOR_POOL: Record<string, string[]> = {
  [GENDER_IDS.men]:    [COLOR_IDS.black, COLOR_IDS.white, COLOR_IDS.grey, COLOR_IDS.blue],
  [GENDER_IDS.women]:  [COLOR_IDS.white, COLOR_IDS.red,   COLOR_IDS.grey, COLOR_IDS.green],
  [GENDER_IDS.kids]:   [COLOR_IDS.red,   COLOR_IDS.blue,  COLOR_IDS.green],
  [GENDER_IDS.unisex]: [COLOR_IDS.white, COLOR_IDS.black, COLOR_IDS.grey, COLOR_IDS.blue, COLOR_IDS.red],
};

const SIZE_POOL = Object.values(SIZE_IDS);

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Starting database seed…\n");

  // ── 1. Clear existing commerce data (order matters for FK constraints) ──────
  console.log("🗑   Clearing existing commerce data…");
  await db.delete(productCollections);
  await db.delete(productImages);
  await db.delete(productVariants);
  await db.delete(products);
  await db.delete(collections);
  await db.delete(categories);
  await db.delete(brands);
  await db.delete(genders);
  await db.delete(colors);
  await db.delete(sizes);
  console.log("    ✓ Cleared\n");

  // ── 2. Filters ────────────────────────────────────────────────────────────
  console.log("📦  Seeding brands…");
  await db.insert(brands).values(brandRows);
  console.log(`    ✓ ${brandRows.length} brand(s)\n`);

  console.log("📦  Seeding genders…");
  await db.insert(genders).values(genderRows);
  console.log(`    ✓ ${genderRows.length} genders\n`);

  console.log("📦  Seeding colors…");
  await db.insert(colors).values(colorRows);
  console.log(`    ✓ ${colorRows.length} colors\n`);

  console.log("📦  Seeding sizes…");
  await db.insert(sizes).values(sizeRows);
  console.log(`    ✓ ${sizeRows.length} sizes\n`);

  // ── 3. Categories (parent first) ──────────────────────────────────────────
  console.log("📦  Seeding categories…");
  // Insert parent before children
  const [parentCat, ...childCats] = categoryRows;
  await db.insert(categories).values(parentCat);
  await db.insert(categories).values(childCats);
  console.log(`    ✓ ${categoryRows.length} categories\n`);

  // ── 4. Collections ────────────────────────────────────────────────────────
  console.log("📦  Seeding collections…");
  await db.insert(collections).values(collectionRows);
  console.log(`    ✓ ${collectionRows.length} collections\n`);

  // ── 5. Products, variants & images ───────────────────────────────────────
  console.log("👟  Seeding products…\n");

  for (const seed of productSeeds) {
    const productId = uuidv4();
    const colorPool = GENDER_COLOR_POOL[seed.genderId] ?? Object.values(COLOR_IDS);
    const pickedColors = pickMany(colorPool, 2, 3);
    const pickedSizes  = pickMany(SIZE_POOL, 3, 6);

    // ── 5a. Insert product (defaultVariantId set later) ───────────────────
    await db.insert(products).values({
      id: productId,
      name: seed.name,
      description: seed.description,
      categoryId: seed.categoryId,
      genderId: seed.genderId,
      brandId: BRAND_ID,
      isPublished: true,
    });

    // ── 5b. Variants: one per (color × size) combination ─────────────────
    let firstVariantId: string | null = null;
    const variantIds: string[] = [];

    for (const colorId of pickedColors) {
      for (const sizeId of pickedSizes) {
        const variantId  = uuidv4();
        const colorSlug  = colorRows.find(c => c.id === colorId)?.slug ?? "x";
        const sizeSlug   = sizeRows.find(s => s.id === sizeId)?.slug ?? "x";
        const sku        = `NK-${slugify(seed.name).slice(0, 12).toUpperCase()}-${colorSlug.toUpperCase()}-${sizeSlug.toUpperCase()}-${variantId.slice(0, 4).toUpperCase()}`;
        const price      = seed.basePrice;
        const salePrice  = Math.random() > 0.7 ? (parseFloat(price) * 0.85).toFixed(2) : null;

        await db.insert(productVariants).values({
          id: variantId,
          productId,
          sku,
          price,
          salePrice: salePrice ?? undefined,
          colorId,
          sizeId,
          inStock: Math.floor(Math.random() * 30) + 5,
          weight: parseFloat((Math.random() * 0.4 + 0.3).toFixed(2)),
          dimensions: { length: 30, width: 12, height: 14 },
        });

        variantIds.push(variantId);
        if (!firstVariantId) firstVariantId = variantId;
      }
    }

    // ── 5c. Set default variant ────────────────────────────────────────────
    if (firstVariantId) {
      await db
        .update(products)
        .set({ defaultVariantId: firstVariantId })
        .where(eq(products.id, productId));
    }

    // ── 5d. Images — resolve /shoes/ paths directly from public/ ─────────
    const imgUrl = resolveImageUrl(seed.image);

    // Primary image (not tied to a specific variant)
    await db.insert(productImages).values({
      id: uuidv4(),
      productId,
      variantId: null,
      url: imgUrl,
      sortOrder: 0,
      isPrimary: true,
    });

    // Extra images tied to the first variant (variant gallery)
    if (seed.extraImages) {
      for (let i = 0; i < seed.extraImages.length; i++) {
        const extraUrl = resolveImageUrl(seed.extraImages[i]);

        await db.insert(productImages).values({
          id: uuidv4(),
          productId,
          variantId: variantIds[0] ?? null,
          url: extraUrl,
          sortOrder: i + 1,
          isPrimary: false,
        });
      }
    }

    // ── 5e. Collection membership ─────────────────────────────────────────
    if (seed.collectionId) {
      await db.insert(productCollections).values({
        id: uuidv4(),
        productId,
        collectionId: seed.collectionId,
      });
    }

    console.log(`    ✓  ${seed.name}`);
    console.log(`       ${pickedColors.length} colors × ${pickedSizes.length} sizes = ${pickedColors.length * pickedSizes.length} variants`);
  }

  console.log(`\n✅  Seed complete — ${productSeeds.length} products inserted.\n`);
}

main().catch((err) => {
  console.error("\n❌  Seed failed:", err);
  process.exit(1);
});
