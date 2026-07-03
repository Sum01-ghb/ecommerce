"use server";

/**
 * cart.ts — Server actions for cart CRUD
 *
 * Session strategy
 * ────────────────
 * • Authenticated user  → cart row keyed by user_id
 * • Guest               → cart row keyed by guest_id (from guest_session cookie)
 * • On sign-in/sign-up  → guest cart is merged into user cart (handled in auth/actions.ts)
 *
 * All actions return a typed ActionResult so the client can handle
 * success and error states uniformly without try/catch on every call.
 *
 * Price handling
 * ──────────────
 * DB prices are NUMERIC strings ("105.00"). We convert to integer cents
 * for the Zustand store to stay consistent with the rest of the UI.
 */

import { db } from "@/lib/db";
import {
  carts,
  cartItems,
  productVariants,
  productImages,
  products,
  categories,
  genders,
  sizes,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser, guestSession, createGuestSession } from "@/lib/auth/actions";
import type { CartItem } from "@/store/cart.store";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CartActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convert a NUMERIC DB string ("105.00") → integer cents (10500). */
function toCents(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.round(parseFloat(value) * 100);
}

/**
 * Resolve (or create) the cart row for the current session.
 * Returns the cart UUID regardless of whether it already existed.
 *
 * Precedence:
 *   1. Authenticated user  → find/create cart by user_id
 *   2. Guest               → find/create cart by guest_id (ensures guest session exists)
 */
async function resolveCartId(): Promise<string> {
  const user = await getCurrentUser();

  if (user) {
    // ── Authenticated ───────────────────────────────────────────────────
    const [existing] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);

    if (existing) return existing.id;

    const [created] = await db
      .insert(carts)
      .values({ userId: user.id })
      .returning({ id: carts.id });

    return created.id;
  }

  // ── Guest ──────────────────────────────────────────────────────────────
  const guestToken = await createGuestSession();

  // Fetch the guest row to get its UUID id
  const { guest } = await import("@/lib/db/schema");
  const [guestRow] = await db
    .select({ id: guest.id })
    .from(guest)
    .where(eq(guest.sessionToken, guestToken))
    .limit(1);

  if (!guestRow) throw new Error("Guest session not found");

  const [existing] = await db
    .select({ id: carts.id })
    .from(carts)
    .where(eq(carts.guestId, guestRow.id))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(carts)
    .values({ guestId: guestRow.id })
    .returning({ id: carts.id });

  return created.id;
}

// ─────────────────────────────────────────────────────────────────────────────
// getCart
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all cart items for the current user/guest session.
 * Returns a fully-typed array ready for the Zustand store.
 */
export async function getCart(): Promise<CartActionResult<CartItem[]>> {
  try {
    const user = await getCurrentUser();
    const guestToken = await guestSession();

    // No session at all — return empty cart
    if (!user && !guestToken) {
      return { success: true, data: [] };
    }

    // Find the cart row
    let cartRow: { id: string } | undefined;

    if (user) {
      const [row] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, user.id))
        .limit(1);
      cartRow = row;
    } else if (guestToken) {
      const { guest } = await import("@/lib/db/schema");
      const [guestRow] = await db
        .select({ id: guest.id })
        .from(guest)
        .where(eq(guest.sessionToken, guestToken))
        .limit(1);

      if (guestRow) {
        const [row] = await db
          .select({ id: carts.id })
          .from(carts)
          .where(eq(carts.guestId, guestRow.id))
          .limit(1);
        cartRow = row;
      }
    }

    if (!cartRow) {
      return { success: true, data: [] };
    }

    // Fetch items with full product/variant details
    const rows = await db
      .select({
        cartItemId:       cartItems.id,
        quantity:         cartItems.quantity,
        variantId:        productVariants.id,
        variantPrice:     productVariants.price,
        variantSalePrice: productVariants.salePrice,
        variantInStock:   productVariants.inStock,
        sizeName:         sizes.name,
        productId:        products.id,
        productName:      products.name,
        categoryName:     categories.name,
        genderLabel:      genders.label,
        imageUrl:         productImages.url,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
      .innerJoin(sizes,           eq(productVariants.sizeId, sizes.id))
      .innerJoin(products,        eq(productVariants.productId, products.id))
      .innerJoin(categories,      eq(products.categoryId, categories.id))
      .innerJoin(genders,         eq(products.genderId, genders.id))
      .leftJoin(
        productImages,
        and(
          eq(productImages.productId, products.id),
          eq(productImages.isPrimary, true)
        )
      )
      .where(eq(cartItems.cartId, cartRow.id));

    const mapped: CartItem[] = rows.map((r) => ({
      cartItemDbId:     r.cartItemId,
      productVariantId: r.variantId,
      productId:        r.productId,
      name:             r.productName,
      category:         `${r.genderLabel}'s ${r.categoryName}`,
      sizeName:         r.sizeName,
      price:            toCents(r.variantSalePrice ?? r.variantPrice),
      imageUrl:         r.imageUrl ?? "/shoes/shoe-1.jpg",
      quantity:         r.quantity,
      inStock:          r.variantInStock,
    }));

    return { success: true, data: mapped };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch cart";
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// addCartItem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a product variant to the cart, or increment quantity if already present.
 * Returns the updated/created CartItem for immediate Zustand upsert.
 */
export async function addCartItem(
  productVariantId: string,
  quantity = 1
): Promise<CartActionResult<CartItem>> {
  try {
    const cartId = await resolveCartId();

    // Check if this variant is already in the cart
    const [existing] = await db
      .select({ id: cartItems.id, quantity: cartItems.quantity })
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cartId),
          eq(cartItems.productVariantId, productVariantId)
        )
      )
      .limit(1);

    let cartItemId: string;

    if (existing) {
      // Increment quantity
      const newQty = existing.quantity + quantity;
      await db
        .update(cartItems)
        .set({ quantity: newQty })
        .where(eq(cartItems.id, existing.id));
      cartItemId = existing.id;
    } else {
      // Insert new row
      const [inserted] = await db
        .insert(cartItems)
        .values({ cartId, productVariantId, quantity })
        .returning({ id: cartItems.id });
      cartItemId = inserted.id;
    }

    // Return the full item shape for the store
    const itemResult = await getCartItemById(cartItemId);
    if (!itemResult) {
      return { success: false, error: "Failed to fetch updated cart item" };
    }

    return { success: true, data: itemResult };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add item to cart";
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// updateCartItem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the quantity of an existing cart item.
 * Pass quantity = 0 to remove the item.
 */
export async function updateCartItem(
  cartItemDbId: string,
  quantity: number
): Promise<CartActionResult<{ cartItemDbId: string; quantity: number }>> {
  try {
    if (quantity <= 0) {
      return removeCartItem(cartItemDbId);
    }

    await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, cartItemDbId));

    return { success: true, data: { cartItemDbId, quantity } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update cart item";
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// removeCartItem
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove a single item from the cart by its cart_items UUID.
 */
export async function removeCartItem(
  cartItemDbId: string
): Promise<CartActionResult<{ cartItemDbId: string; quantity: number }>> {
  try {
    await db.delete(cartItems).where(eq(cartItems.id, cartItemDbId));
    return { success: true, data: { cartItemDbId, quantity: 0 } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to remove cart item";
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// clearCart
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Remove all items from the current user/guest cart.
 */
export async function clearCart(): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    const guestToken = await guestSession();

    if (!user && !guestToken) {
      return { success: true, data: undefined };
    }

    let cartId: string | undefined;

    if (user) {
      const [row] = await db
        .select({ id: carts.id })
        .from(carts)
        .where(eq(carts.userId, user.id))
        .limit(1);
      cartId = row?.id;
    } else if (guestToken) {
      const { guest } = await import("@/lib/db/schema");
      const [guestRow] = await db
        .select({ id: guest.id })
        .from(guest)
        .where(eq(guest.sessionToken, guestToken))
        .limit(1);

      if (guestRow) {
        const [row] = await db
          .select({ id: carts.id })
          .from(carts)
          .where(eq(carts.guestId, guestRow.id))
          .limit(1);
        cartId = row?.id;
      }
    }

    if (cartId) {
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    }

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clear cart";
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// mergeGuestCartIntoUserCart
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Merge all items from a guest cart into the authenticated user's cart.
 * Called after successful sign-in or sign-up.
 *
 * Strategy: upsert — if the user already has the same variant in their cart,
 * add the guest quantity on top of the existing quantity.
 */
export async function mergeGuestCartIntoUserCart(
  guestToken: string
): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { guest } = await import("@/lib/db/schema");

    // Find guest row
    const [guestRow] = await db
      .select({ id: guest.id })
      .from(guest)
      .where(eq(guest.sessionToken, guestToken))
      .limit(1);

    if (!guestRow) return { success: true, data: undefined }; // nothing to merge

    // Find guest cart
    const [guestCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.guestId, guestRow.id))
      .limit(1);

    if (!guestCart) return { success: true, data: undefined }; // no guest cart

    // Fetch guest cart items
    const guestCartItems = await db
      .select({
        productVariantId: cartItems.productVariantId,
        quantity:         cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    if (guestCartItems.length === 0) return { success: true, data: undefined };

    // Find or create user cart
    let userCartId: string;
    const [userCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.userId, user.id))
      .limit(1);

    if (userCart) {
      userCartId = userCart.id;
    } else {
      const [created] = await db
        .insert(carts)
        .values({ userId: user.id })
        .returning({ id: carts.id });
      userCartId = created.id;
    }

    // Upsert each guest item into user cart
    for (const item of guestCartItems) {
      const [existing] = await db
        .select({ id: cartItems.id, quantity: cartItems.quantity })
        .from(cartItems)
        .where(
          and(
            eq(cartItems.cartId, userCartId),
            eq(cartItems.productVariantId, item.productVariantId)
          )
        )
        .limit(1);

      if (existing) {
        await db
          .update(cartItems)
          .set({ quantity: existing.quantity + item.quantity })
          .where(eq(cartItems.id, existing.id));
      } else {
        await db
          .insert(cartItems)
          .values({
            cartId: userCartId,
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          });
      }
    }

    // Clean up guest cart
    await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to merge cart";
    return { success: false, error: message };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal: getCartItemById
// ─────────────────────────────────────────────────────────────────────────────

async function getCartItemById(cartItemId: string): Promise<CartItem | null> {
  const rows = await db
    .select({
      cartItemId:       cartItems.id,
      quantity:         cartItems.quantity,
      variantId:        productVariants.id,
      variantPrice:     productVariants.price,
      variantSalePrice: productVariants.salePrice,
      variantInStock:   productVariants.inStock,
      sizeName:         sizes.name,
      productId:        products.id,
      productName:      products.name,
      categoryName:     categories.name,
      genderLabel:      genders.label,
      imageUrl:         productImages.url,
    })
    .from(cartItems)
    .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
    .innerJoin(sizes,           eq(productVariants.sizeId, sizes.id))
    .innerJoin(products,        eq(productVariants.productId, products.id))
    .innerJoin(categories,      eq(products.categoryId, categories.id))
    .innerJoin(genders,         eq(products.genderId, genders.id))
    .leftJoin(
      productImages,
      and(
        eq(productImages.productId, products.id),
        eq(productImages.isPrimary, true)
      )
    )
    .where(eq(cartItems.id, cartItemId))
    .limit(1);

  const r = rows[0];
  if (!r) return null;

  return {
    cartItemDbId:     r.cartItemId,
    productVariantId: r.variantId,
    productId:        r.productId,
    name:             r.productName,
    category:         `${r.genderLabel}'s ${r.categoryName}`,
    sizeName:         r.sizeName,
    price:            toCents(r.variantSalePrice ?? r.variantPrice),
    imageUrl:         r.imageUrl ?? "/shoes/shoe-1.jpg",
    quantity:         r.quantity,
    inStock:          r.variantInStock,
  };
}
