import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import { nextCookies } from "better-auth/next-js";

/**
 * Better Auth instance.
 *
 * - Email/password login is enabled (no verification in MVP).
 * - The Drizzle adapter is pointed at the modular auth schema in `src/lib/db/schema/`.
 * - Session cookie is named `auth_session`, HttpOnly, Secure, SameSite=lax.
 *
 * OAuth providers (Google, Apple) are stubbed — add `socialProviders` config
 * when ready. The `account` / `verification` tables are already in the schema.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  emailAndPassword: {
    enabled: true,
    // No email verification in MVP — flip to true post-MVP
    requireEmailVerification: false,
  },

  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  cookies: {
    sessionToken: {
      name: "auth_session",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    },
  },

  advanced: {
    cookiePrefix: "nike",
    useSecureCookies: process.env.NODE_ENV === "production",
    database: {
      generateId: () => uuidv4(),
    },
  },

  plugins: [nextCookies()],
});

/** Inferred type helpers for use throughout the app */
export type AuthSession = typeof auth.$Infer.Session;
export type AuthUser = typeof auth.$Infer.Session.user;
