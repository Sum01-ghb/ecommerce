import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

export default defineConfig({
  // Include both the commerce schema and the new modular auth schema
  schema: ["./src/db/schema.ts", "./src/lib/db/schema/index.ts"],
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
