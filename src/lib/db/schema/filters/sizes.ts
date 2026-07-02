import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * `sizes` — filter dimension for product variant sizes.
 * `sort_order` keeps S < M < L ordering consistent in the UI.
 */
export const sizes = pgTable("sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),           // "M"
  slug: text("slug").notNull().unique(),  // "m"
  sortOrder: integer("sort_order").notNull().default(0),
});

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertSizeSchema = createInsertSchema(sizes);
export const selectSizeSchema = createSelectSchema(sizes);

export type Size    = typeof sizes.$inferSelect;
export type NewSize = typeof sizes.$inferInsert;
