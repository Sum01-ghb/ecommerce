import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as authSchema from "./schema";
import * as productSchema from "@/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

/**
 * Combined schema for Drizzle — auth tables live in `src/lib/db/schema/`
 * while product/commerce tables remain in `src/db/schema.ts`.
 *
 * Both are merged here so queries across all tables work from one `db` client.
 */
const schema = { ...authSchema, ...productSchema };

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
export type Database = typeof db;

// Re-export both schema namespaces for convenience
export * from "./schema";
export * from "@/db/schema";
