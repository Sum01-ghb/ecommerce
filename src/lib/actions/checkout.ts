"use server";

/**
 * checkout.ts — createStripeCheckoutSession server action
 *
 * Flow
 * ────
 * 1. Verify user is authenticated (guests must sign in first — redirect to
 *    /sign-in?callbackUrl=/cart if not).
 * 2. If a guest_session cookie exists, merge that guest cart into the user's
 *    cart before reading items.
 * 3. Fetch the user's cart items from DB.
 * 4. Guard: return error if cart is empty.
 * 5. Build Stripe line_items from cart data.
 * 6. Create a Stripe Checkout Session (hosted page mode).
 * 7. Embed userId + cartId in session metadata for the webhook.
 * 8. Return the checkout URL for client-side redirect.
 */

import { stripe } from "@/lib/stripe/client";
import { db } from "@/lib/db";
import {
  carts,
  cartItems,
  productVariants,
  products,
  productImages,
  sizes,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/actions";
import { mergeSessionsIfNeeded } from "@/lib/utils/mergeSessions";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CheckoutResult =
  | { success: true; url: string }
  | { success: false; error: string; redirect?: string };

// ─────────────────────────────────────────────────────────────────────────────
// createStripeCheckoutSession
// ─────────────────────────────────────────────────────────────────────────────

export async function createStripeCheckoutSession(): Promise<CheckoutResult> {
  // ── 1. Auth guard ──────────────────────────────────────────────────────────
  const user = await getCurrentUser();
  if (!user) {
    return {
      success: false,
      error: "Please sign in to continue",
      redirect: "/sign-in?callbackUrl=/cart",
    };
  }

  try {
    // ── 2. Merge guest cart if present ─────────────────────────────────────
    await mergeSessionsIfNeeded();

    // ── 3. Fetch user's cart ───────────────────────────────────────────────
    const [cart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);

    if (!cart) {
      return { success: false, error: "Your cart is empty" };
    }

    // ── 4. Fetch cart items with product details ───────────────────────────
    const rows = await db
      .select({
        quantity: cartItems.quantity,
        variantPrice: productVariants.price,
        variantSalePrice: productVariants.salePrice,
        productName: products.name,
        sizeName: sizes.name,
        imageUrl: productImages.url,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(sizes, eq(productVariants.sizeId, sizes.id))
      .leftJoin(
        productImages,
        and(
          eq(productImages.productId, products.id),
          eq(productImages.isPrimary, true)
        )
      )
      .where(eq(cartItems.cartId, cart.id));

    // ── 5. Guard: empty cart ───────────────────────────────────────────────
    if (rows.length === 0) {
      return { success: false, error: "Your cart is empty" };
    }

    // ── 6. Build Stripe line_items ─────────────────────────────────────────
    const lineItems: import("stripe").Stripe.Checkout.SessionCreateParams.LineItem[] =
      rows.map((row) => {
        // Use sale price when available; DB stores as NUMERIC string
        const rawPrice = row.variantSalePrice ?? row.variantPrice;
        const priceCents = Math.round(parseFloat(rawPrice) * 100);

        // Stripe requires images to be absolute URLs
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const imageUrl = row.imageUrl?.startsWith("http")
          ? row.imageUrl
          : row.imageUrl
          ? `${appUrl}${row.imageUrl}`
          : undefined;

        return {
          price_data: {
            currency: "usd",
            unit_amount: priceCents,
            product_data: {
              name: `${row.productName} — Size ${row.sizeName}`,
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
          },
          quantity: row.quantity,
        };
      });

    // ── 7. Create Stripe session ───────────────────────────────────────────
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      // Collect shipping for order record
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU", "DE", "FR", "SG", "BD", "IN"],
      },
      // Embed identifiers for webhook processing
      metadata: {
        userId: user.id,
        cartId: cart.id,
      },
      // Pre-fill email if available
      customer_email: user.email ?? undefined,
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/cart`,
    });

    if (!session.url) {
      return { success: false, error: "Failed to create Stripe checkout session" };
    }

    return { success: true, url: session.url };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Checkout failed. Please try again.";
    console.error("[createStripeCheckoutSession] error:", err);
    return { success: false, error: message };
  }
}
