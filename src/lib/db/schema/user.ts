import {pgTable, text, boolean, timestamp, uuid} from "drizzle-orm/pg-core";

/**
 * `user` — Better Auth core table.
 *
 * Column names must exactly match what Better Auth expects.
 * `id` uses text to match Better Auth's generated IDs.
 */
export const user = pgTable("user", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
