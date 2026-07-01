import { pgTable, text, integer, serial, timestamp, boolean } from "drizzle-orm/pg-core";

// Products Table
export const products = pgTable("product", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: integer("price").notNull(), // price in cents
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Auth tables (user, session, account, verification) are defined in src/lib/db/schema/
// This file only contains product/commerce tables
