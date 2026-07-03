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

const GUEST_COOKIE = "guest_session";
const GUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000; 

const COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, 
} as const;

export async function guestSession(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(GUEST_COOKIE)?.value ?? null;
}

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

async function clearGuestSession(token: string): Promise<void> {
  await db.delete(guest).where(eq(guest.sessionToken, token));
  const cookieStore = await cookies();
  cookieStore.delete(GUEST_COOKIE);
}

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

export async function signUp(
  input: SignUpInput,
  callbackUrl = "/",
  guestCartJson?: string,
): Promise<ActionResult> {

  const parsed = signUpSchema.safeParse(input);
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

  const { name, email, password } = parsed.data;

  try {

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

  redirect(callbackUrl);
}

export async function signIn(
  input: SignInInput,
  callbackUrl = "/",
  guestCartJson?: string,
): Promise<ActionResult> {

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

  redirect(callbackUrl);
}

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