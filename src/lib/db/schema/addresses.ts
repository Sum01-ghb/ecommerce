import { boolean, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { user } from "./user";

// ── Enums ─────────────────────────────────────────────────────────────────────
export const addressTypeEnum = pgEnum("address_type", ["billing", "shipping"]);

/**
 * `addresses` — postal addresses linked to a user.
 * A user may have many addresses; `is_default` flags the preferred one per type.
 */
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: addressTypeEnum("type").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(user, {
    fields: [addresses.userId],
    references: [user.id],
  }),
}));

// ── Zod schemas ──────────────────────────────────────────────────────────────
export const insertAddressSchema = createInsertSchema(addresses);
export const selectAddressSchema = createSelectSchema(addresses);

export type Address    = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;
