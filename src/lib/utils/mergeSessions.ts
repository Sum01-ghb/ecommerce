/**
 * mergeSessions.ts — Guest → User cart merge helper
 *
 * Thin wrapper that coordinates session merging before checkout.
 * This is called from createStripeCheckoutSession to ensure any
 * guest cart is absorbed into the user cart before we read items
 * for the Stripe session.
 *
 * The heavy lifting lives in mergeGuestCartIntoUserCart (cart.ts);
 * this module handles the cookie-reading part cleanly.
 */

"use server";

import { guestSession } from "@/lib/auth/actions";
import { mergeGuestCartIntoUserCart } from "@/lib/actions/cart";

/**
 * If a guest_session cookie is present and the user is now authenticated,
 * merge the guest cart into the user cart and clean up the guest session.
 *
 * Safe to call even when there is no guest session — it returns early.
 *
 * Returns true if a merge was performed, false otherwise.
 */
export async function mergeSessionsIfNeeded(): Promise<boolean> {
  const token = await guestSession();
  if (!token) return false;

  const result = await mergeGuestCartIntoUserCart(token);
  return result.success;
}
