import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * `brands` — manufacturer / brand identity.
 * e.g. Nike, Adidas, Puma
 *
 * The `products → brands` relation is declared in products.ts to avoid
 * a circular import.
 */
export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  /** Optional CDN or local URL for the brand logo. */
  logoUrl: text("logo_url"),
});

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertBrandSchema = createInsertSchema(brands);
export const selectBrandSchema = createSelectSchema(brands);

export type Brand    = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
