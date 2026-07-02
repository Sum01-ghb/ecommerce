import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * `colors` — filter dimension for product variant colors.
 * e.g. Red, Black, White
 */
export const colors = pgTable("colors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),          // "Red"
  slug: text("slug").notNull().unique(), // "red"
  hexCode: text("hex_code").notNull(),   // "#FF0000"
});

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertColorSchema = createInsertSchema(colors);
export const selectColorSchema = createSelectSchema(colors);

export type Color    = typeof colors.$inferSelect;
export type NewColor = typeof colors.$inferInsert;
