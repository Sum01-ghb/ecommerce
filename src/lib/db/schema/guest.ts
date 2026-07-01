import {pgTable, text, timestamp, uuid} from "drizzle-orm/pg-core";

/**
 * `guest` — anonymous/guest session tracking.
 *
 * A guest record is created on first visit and identified by a UUID stored in
 * the `guest_session` HttpOnly cookie. Cart items (Zustand) are keyed to this
 * token client-side. On sign-in / sign-up the guest cart is merged into the
 * authenticated user's cart before this record is deleted.
 *
 * Cookie spec: HttpOnly, Secure, SameSite=Strict, path=/, max-age=7 days.
 */
export const guest = pgTable("guest", {
  id: uuid("id").primaryKey(), // UUID — matches sessionToken for easy lookup
  sessionToken: text("session_token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export type Guest = typeof guest.$inferSelect;
export type NewGuest = typeof guest.$inferInsert;
