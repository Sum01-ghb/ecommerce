import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

const sql = neon(process.env.DATABASE_URL!);

/**
 * Single Drizzle client for the entire application.
 * All tables — auth and commerce — are unified under one schema object.
 */
export const db = drizzle(sql, { schema });
export type Database = typeof db;

// Re-export full schema for convenience
export * from "./schema";
