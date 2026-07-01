import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

/**
 * `verification` — Better Auth verification table.
 *
 * Used post-MVP for email verification, password reset tokens, etc.
 * Schema is included now so migrations don't break when enabling these features.
 *
 * - `identifier`: target (e.g. email address)
 * - `value`: the token or OTP code to verify against
 */
export const verification = pgTable("verification", {
  id: uuid("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
