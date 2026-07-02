import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { orders } from "./orders";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const paymentMethodEnum = pgEnum("payment_method", [
  "stripe",
  "paypal",
  "cod",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "initiated",
  "completed",
  "failed",
]);

/**
 * `payments` — one payment record per order.
 * `transaction_id` is set by the payment gateway after processing.
 */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  method: paymentMethodEnum("method").notNull(),
  status: paymentStatusEnum("status").notNull().default("initiated"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  transactionId: text("transaction_id"),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

export type Payment    = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
