import {
  boolean,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { categories } from "./categories";
import { brands } from "./brands";
import { genders } from "./filters/genders";
import { colors } from "./filters/colors";
import { sizes } from "./filters/sizes";
import { user } from "./user";

// ─────────────────────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `products` — master product record.
 *
 * `default_variant_id` is a nullable FK back to `product_variants` that
 * designates the variant shown first on the PDP. Because the `product_variants`
 * table references `products.id`, this creates a two-table circular dependency.
 * Drizzle handles it via deferred constraints — we set the column here and add
 * the FK reference in the `productVariants` table to break the cycle.
 */
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  genderId: uuid("gender_id")
    .notNull()
    .references(() => genders.id, { onDelete: "restrict" }),
  brandId: uuid("brand_id")
    .notNull()
    .references(() => brands.id, { onDelete: "restrict" }),
  isPublished: boolean("is_published").notNull().default(false),
  /**
   * Nullable FK to product_variants.id.
   * The FK constraint is declared on `productVariants` to avoid a forward reference.
   * Here we store the UUID value only.
   */
  defaultVariantId: uuid("default_variant_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Product Variants
// ─────────────────────────────────────────────────────────────────────────────

/** Dimensions stored as JSONB: { length, width, height } in cm/inches. */
export interface Dimensions {
  length: number;
  width: number;
  height: number;
}

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  colorId: uuid("color_id")
    .notNull()
    .references(() => colors.id, { onDelete: "restrict" }),
  sizeId: uuid("size_id")
    .notNull()
    .references(() => sizes.id, { onDelete: "restrict" }),
  inStock: integer("in_stock").notNull().default(0),
  weight: real("weight"),                 // kg
  dimensions: jsonb("dimensions").$type<Dimensions>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// Product Images
// ─────────────────────────────────────────────────────────────────────────────

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  /** Optional: image can be tied to a specific variant (e.g. color swatch). */
  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
});

// ─────────────────────────────────────────────────────────────────────────────
// Relations
// ─────────────────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  gender: one(genders, {
    fields: [products.genderId],
    references: [genders.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  defaultVariant: one(productVariants, {
    fields: [products.defaultVariantId],
    references: [productVariants.id],
    relationName: "default_variant",
  }),
  variants: many(productVariants),
  images: many(productImages),
}));

export const productVariantsRelations = relations(productVariants, ({ one, many }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
  color: one(colors, {
    fields: [productVariants.colorId],
    references: [colors.id],
  }),
  size: one(sizes, {
    fields: [productVariants.sizeId],
    references: [sizes.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  variant: one(productVariants, {
    fields: [productImages.variantId],
    references: [productVariants.id],
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Zod schemas
// ─────────────────────────────────────────────────────────────────────────────

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertProductVariantSchema = createInsertSchema(productVariants, {
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
});
export const selectProductVariantSchema = createSelectSchema(productVariants);

export const insertProductImageSchema = createInsertSchema(productImages);
export const selectProductImageSchema = createSelectSchema(productImages);

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type Product           = typeof products.$inferSelect;
export type NewProduct        = typeof products.$inferInsert;
export type ProductVariant    = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage      = typeof productImages.$inferSelect;
export type NewProductImage   = typeof productImages.$inferInsert;
