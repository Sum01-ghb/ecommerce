import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";
import { user } from "./user";

/**
 * `account` — Better Auth account table.
 *
 * Supports both credential-based logins (password stored here after hashing)
 * and future OAuth providers (access/refresh tokens, idToken, scope).
 *
 * - `providerId`: e.g. "credential", "google", "apple"
 * - `accountId`: provider-specific user identifier
 */
export const account = pgTable("account", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  idToken: text("id_token"),
  /** Hashed password — only set for "credential" provider. */
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
