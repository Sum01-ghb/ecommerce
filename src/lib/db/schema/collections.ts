import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "./products";

export const collections = pgTable("collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),           
  slug: text("slug").notNull().unique(),  
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const productCollections = pgTable("product_collections", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  collectionId: uuid("collection_id")
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
});

export const collectionsRelations = relations(collections, ({ many }) => ({
  productCollections: many(productCollections),
}));

export const productCollectionsRelations = relations(productCollections, ({ one }) => ({
  product: one(products, {
    fields: [productCollections.productId],
    references: [products.id],
  }),
  collection: one(collections, {
    fields: [productCollections.collectionId],
    references: [collections.id],
  }),
}));

export const insertCollectionSchema        = createInsertSchema(collections);
export const selectCollectionSchema        = createSelectSchema(collections);
export const insertProductCollectionSchema = createInsertSchema(productCollections);
export const selectProductCollectionSchema = createSelectSchema(productCollections);

export type Collection           = typeof collections.$inferSelect;
export type NewCollection        = typeof collections.$inferInsert;
export type ProductCollection    = typeof productCollections.$inferSelect;
export type NewProductCollection = typeof productCollections.$inferInsert;