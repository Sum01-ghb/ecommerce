"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { guest } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  signUpSchema,
  signInSchema,
  cartSchema,
  type SignUpInput,
  type SignInInput,
  type CartItemInput,
  type ActionResult,
} from "./schemas";

// Types and schemas are exported from ./schemas.ts

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GUEST_COOKIE = "guest_session";
const GUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
} as const;

// ---------------------------------------------------------------------------
// Guest session helpers
// ---------------------------------------------------------------------------

/**
 * Read the current guest session token from the cookie jar.
 * Returns null if no guest session exists.
 */
export async function guestSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

/**
 * Create a new guest session — insert a DB record and set the cookie.
 * If a valid, non-expired guest session already exists, return it unchanged.
 */
export async function createGuestSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_COOKIE)?.value;

  if (existing) {
    const [row] = await db
      .select()
      .from(guest)
      .where(eq(guest.sessionToken, existing))
      .limit(1);

    if (row && row.expiresAt > new Date()) {
      return existing;
    }
  }

  const token = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + GUEST_TTL_MS);

  await db.insert(guest).values({
    id: token,
    sessionToken: token,
    createdAt: now,
    expiresAt,
  });

  cookieStore.set(GUEST_COOKIE, token, {
    ...COOKIE_DEFAULTS,
    expires: expiresAt,
  });

  return token;
}

/**
 * Delete a guest session from the DB and clear its cookie.
 * Called after successful login / sign-up.
 */
async function clearGuestSession(token: string): Promise<void> {
  await db.delete(guest).where(eq(guest.sessionToken, token));
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}

// ---------------------------------------------------------------------------
// Cart migration helpers
// ---------------------------------------------------------------------------

/**
 * Validate and return guest cart items so the client can rehydrate the
 * Zustand store under the authenticated user.
 *
 * In a future iteration this will upsert into a server-side cart table.
 */
export async function mergeGuestCartWithUserCart(
  guestCartJson: string,
): Promise<ActionResult<{ mergedItems: CartItemInput[] }>> {
  let raw: unknown;
  try {
    raw = JSON.parse(guestCartJson);
  } catch {
    return { success: false, error: "Invalid cart data" };
  }

  const parsed = cartSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Invalid cart data" };
  }

  return { success: true, data: { mergedItems: parsed.data } };
}

// ---------------------------------------------------------------------------
// Sign Up
// ---------------------------------------------------------------------------

/**
 * Register a new user with email + password.
 *
 * 1. Server-side Zod validation.
 * 2. Create account via Better Auth.
 * 3. Merge + clear guest session.
 * 4. Redirect to callbackUrl.
 *
 * Returns an ActionResult only on validation / auth errors.
 * On success it calls `redirect()` which throws internally (Next.js design).
 */
export async function signUp(
  input: SignUpInput,
  callbackUrl = "/",
  guestCartJson?: string,
): Promise<ActionResult> {
  // 1. Validate
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    // Zod v4: use .error.issues to build field errors instead of deprecated .flatten()
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      fieldErrors[key] ??= [];
      fieldErrors[key].push(issue.message);
    }
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    // 2. Create account
    const reqHeaders = await headers();
    const response = await auth.api.signUpEmail({
      body: { name, email, password },
      headers: reqHeaders,
    });

    if (!response || "error" in response) {
      const msg =
        (response as { error?: { message?: string } })?.error?.message ??
        "Sign up failed. Please try again.";
      return { success: false, error: msg };
    }

    // 3. Merge cart, then clear guest session
    const guestToken = await guestSession();
    if (guestToken) {
      const { mergeGuestCartIntoUserCart } = await import("@/lib/actions/cart");
      await mergeGuestCartIntoUserCart(guestToken);
      await clearGuestSession(guestToken);
    } else if (guestCartJson) {
      await mergeGuestCartWithUserCart(guestCartJson);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    if (
      message.toLowerCase().includes("email") &&
      message.toLowerCase().includes("exist")
    ) {
      return {
        success: false,
        error: "An account with this email already exists.",
        fieldErrors: { email: ["An account with this email already exists."] },
      };
    }
    return { success: false, error: message };
  }

  // 4. Redirect — must be outside try/catch (Next.js throws NEXT_REDIRECT internally)
  redirect(callbackUrl);
}

// ---------------------------------------------------------------------------
// Sign In
// ---------------------------------------------------------------------------

/**
 * Authenticate an existing user.
 *
 * 1. Server-side Zod validation.
 * 2. Sign in via Better Auth.
 * 3. Merge + clear guest session.
 * 4. Redirect to callbackUrl.
 */
export async function signIn(
  input: SignInInput,
  callbackUrl = "/",
  guestCartJson?: string,
): Promise<ActionResult> {
  // 1. Validate
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString() ?? "_";
      fieldErrors[key] ??= [];
      fieldErrors[key].push(issue.message);
    }
    return {
      success: false,
      error: "Please fix the errors below.",
      fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  try {
    // 2. Authenticate
    const reqHeaders = await headers();
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: reqHeaders,
    });

    if (!response || "error" in response) {
      const msg =
        (response as { error?: { message?: string } })?.error?.message ??
        "Invalid email or password.";
      return { success: false, error: msg };
    }

    // 3. Merge cart, then clear guest session
    const guestToken2 = await guestSession();
    if (guestToken2) {
      const { mergeGuestCartIntoUserCart } = await import("@/lib/actions/cart");
      await mergeGuestCartIntoUserCart(guestToken2);
      await clearGuestSession(guestToken2);
    } else if (guestCartJson) {
      await mergeGuestCartWithUserCart(guestCartJson);
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    return { success: false, error: message };
  }

  // 4. Redirect
  redirect(callbackUrl);
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------

/**
 * Invalidate the current authenticated session and redirect.
 */
export async function signOut(callbackUrl = "/"): Promise<ActionResult> {
  try {
    const reqHeaders = await headers();
    await auth.api.signOut({ headers: reqHeaders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sign out failed.";
    return { success: false, error: message };
  }

  redirect(callbackUrl);
}

export async function getCurrentUser() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session?.user ?? null;
  } catch (e) {
    console.log(e);
    return null;
  }
}
