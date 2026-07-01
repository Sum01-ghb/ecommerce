/**
 * Legacy re-export shim.
 *
 * Existing imports (`@/db`, `@/db/schema`) continue to work unchanged.
 * The canonical DB client now lives in `src/lib/db/index.ts` which merges
 * both auth schema and product schema into a single Drizzle instance.
 */
export { db, type Database } from "@/lib/db";
export * from "./schema";
