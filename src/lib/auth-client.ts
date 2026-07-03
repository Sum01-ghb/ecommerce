/**
 * auth-client.ts — Better Auth browser client
 *
 * Import `authClient` in client components whenever you need to call
 * Better Auth methods from the browser (e.g. signIn.social, signOut).
 *
 * The `baseURL` is set from NEXT_PUBLIC_APP_URL so it works on both
 * localhost and Vercel deployments without code changes.
 */

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
});
