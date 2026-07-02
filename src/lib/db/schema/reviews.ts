import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { products } from "./products";
import { user } from "./user";

/**
 * `reviews` — user ratings and comments on a product.
 * Rating is constrained to 1–5 in the Zod schema (DB-level check can be added via migration).
 */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),   // 1–5
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [reviews.userId],
    references: [user.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertReviewSchema = createInsertSchema(reviews, {
  rating: z.number().int().min(1).max(5),
});
export const selectReviewSchema = createSelectSchema(reviews);

export type Review    = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
