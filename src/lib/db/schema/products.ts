import {
  boolean,
  index,
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

  defaultVariantId: uuid("default_variant_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({

  brandPublishedIdx: index("products_brand_published_idx").on(table.brandId, table.isPublished),
  categoryPublishedIdx: index("products_category_published_idx").on(table.categoryId, table.isPublished),
  genderPublishedIdx: index("products_gender_published_idx").on(table.genderId, table.isPublished),
  createdAtIdx: index("products_created_at_idx").on(table.createdAt),
}));

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
  weight: real("weight"),                 
  dimensions: jsonb("dimensions").$type<Dimensions>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({

  colorProductIdx: index("product_variants_color_product_idx").on(table.colorId, table.productId),

  sizeProductIdx: index("product_variants_size_product_idx").on(table.sizeId, table.productId),

  priceIdx: index("product_variants_price_idx").on(table.price),
}));

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),

  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
}, (table) => ({

  productIdIdx: index("product_images_product_id_idx").on(table.productId),

  variantIdIdx: index("product_images_variant_id_idx").on(table.variantId),
}));

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

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);

export const insertProductVariantSchema = createInsertSchema(productVariants, {
  price: z.string().regex(/^\d+(\.\d{1,2})?$/),
  salePrice: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
});
export const selectProductVariantSchema = createSelectSchema(productVariants);

export const insertProductImageSchema = createInsertSchema(productImages);
export const selectProductImageSchema = createSelectSchema(productImages);

export type Product           = typeof products.$inferSelect;
export type NewProduct        = typeof products.$inferInsert;
export type ProductVariant    = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ProductImage      = typeof productImages.$inferSelect;
export type NewProductImage   = typeof productImages.$inferInsert;