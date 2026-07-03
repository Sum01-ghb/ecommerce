import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const sizes = pgTable("sizes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),           
  slug: text("slug").notNull().unique(),  
  sortOrder: integer("sort_order").notNull().default(0),
});

export const insertSizeSchema = createInsertSchema(sizes);
export const selectSizeSchema = createSelectSchema(sizes);

export type Size    = typeof sizes.$inferSelect;
export type NewSize = typeof sizes.$inferInsert;