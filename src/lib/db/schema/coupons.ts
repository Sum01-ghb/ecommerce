import { integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);

/**
 * `coupons` — promotional discount codes.
 * `used_count` is incremented on each successful redemption.
 * `max_usage` null means unlimited.
 */
export const coupons = pgTable("coupons", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  maxUsage: integer("max_usage"),
  usedCount: integer("used_count").notNull().default(0),
});

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertCouponSchema = createInsertSchema(coupons);
export const selectCouponSchema = createSelectSchema(coupons);

export type Coupon    = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
