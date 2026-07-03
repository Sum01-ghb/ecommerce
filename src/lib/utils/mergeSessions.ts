"use server";

import { guestSession } from "@/lib/auth/actions";
import { mergeGuestCartIntoUserCart } from "@/lib/actions/cart";

export async function mergeSessionsIfNeeded(): Promise<boolean> {
  const token = await guestSession();
  if (!token) return false;

  const result = await mergeGuestCartIntoUserCart(token);
  return result.success;
}