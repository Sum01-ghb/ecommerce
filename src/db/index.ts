import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Initialize Neon SQL client with connection string
const sql = neon(process.env.DATABASE_URL || "");

// Export the Drizzle client initialized with schema
export const db = drizzle(sql, { schema });
export type Database = typeof db;
export * from "./schema";
