import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * `genders` — filter dimension for product targeting.
 * e.g. Men, Women, Kids, Unisex
 *
 * The `products → genders` relation is declared in products.ts to avoid
 * a circular import (products imports genders, so genders must not import products).
 */
export const genders = pgTable("genders", {
  id: uuid("id").primaryKey().defaultRandom(),
  label: text("label").notNull(),       // "Men"
  slug: text("slug").notNull().unique(), // "men"
});

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertGenderSchema = createInsertSchema(genders);
export const selectGenderSchema = createSelectSchema(genders);

export type Gender    = typeof genders.$inferSelect;
export type NewGender = typeof genders.$inferInsert;
