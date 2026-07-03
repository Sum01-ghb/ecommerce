import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { v4 as uuidv4 } from "uuid";
import { nextCookies } from "better-auth/next-js";

/**
 * Better Auth instance.
 *
 * Providers
 * ─────────
 * • Email/password  — always enabled, no verification in MVP
 * • Google OAuth    — enabled when GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET are set
 * • Apple OAuth     — enabled when APPLE_CLIENT_ID + APPLE_CLIENT_SECRET are set
 *
 * To activate a provider set the corresponding env vars and restart the server.
 * The account / verification tables are already in the schema.
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

  // ── Email & password ───────────────────────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // ── Social OAuth providers ─────────────────────────────────────────────────
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET
      ? {
          apple: {
            clientId: process.env.APPLE_CLIENT_ID,
            clientSecret: process.env.APPLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  // ── Session ────────────────────────────────────────────────────────────────
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },

  // ── Cookie config ──────────────────────────────────────────────────────────
  cookies: {
    sessionToken: {
      name: "auth_session",
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const, // "lax" required for OAuth redirects
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    },
  },

  // ── Advanced ───────────────────────────────────────────────────────────────
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
export type AuthUser    = typeof auth.$Infer.Session.user;
