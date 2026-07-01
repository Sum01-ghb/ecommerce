import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import { user } from "./user";

/**
 * `session` — Better Auth session table.
 *
 * - `token` is the opaque session token stored in the `auth_session` cookie.
 * - `userId` is a FK to `user.id`.
 */
export const session = pgTable("session", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
