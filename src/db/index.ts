/**
 * Legacy re-export shim — keeps existing `@/db` imports working.
 * The canonical DB client and schema now live in `src/lib/db/`.
 */
export { db, type Database } from "@/lib/db";
export * from "@/lib/db/schema";
