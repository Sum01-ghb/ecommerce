"use server";

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

export type CartActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function toCents(value: string | null | undefined): number {
  if (!value) return 0;
  return Math.round(parseFloat(value) * 100);
}

async function resolveCartId(): Promise<string> {
  const user = await getCurrentUser();

  if (user) {

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

  const guestToken = await createGuestSession();

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

export async function getCart(): Promise<CartActionResult<CartItem[]>> {
  try {
    const user = await getCurrentUser();
    const guestToken = await guestSession();

    if (!user && !guestToken) {
      return { success: true, data: [] };
    }

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

export async function addCartItem(
  productVariantId: string,
  quantity = 1
): Promise<CartActionResult<CartItem>> {
  try {
    const cartId = await resolveCartId();

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

      const newQty = existing.quantity + quantity;
      await db
        .update(cartItems)
        .set({ quantity: newQty })
        .where(eq(cartItems.id, existing.id));
      cartItemId = existing.id;
    } else {

      const [inserted] = await db
        .insert(cartItems)
        .values({ cartId, productVariantId, quantity })
        .returning({ id: cartItems.id });
      cartItemId = inserted.id;
    }

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

export async function mergeGuestCartIntoUserCart(
  guestToken: string
): Promise<CartActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const { guest } = await import("@/lib/db/schema");

    const [guestRow] = await db
      .select({ id: guest.id })
      .from(guest)
      .where(eq(guest.sessionToken, guestToken))
      .limit(1);

    if (!guestRow) return { success: true, data: undefined }; 

    const [guestCart] = await db
      .select({ id: carts.id })
      .from(carts)
      .where(eq(carts.guestId, guestRow.id))
      .limit(1);

    if (!guestCart) return { success: true, data: undefined }; 

    const guestCartItems = await db
      .select({
        productVariantId: cartItems.productVariantId,
        quantity:         cartItems.quantity,
      })
      .from(cartItems)
      .where(eq(cartItems.cartId, guestCart.id));

    if (guestCartItems.length === 0) return { success: true, data: undefined };

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

    await db.delete(cartItems).where(eq(cartItems.cartId, guestCart.id));
    await db.delete(carts).where(eq(carts.id, guestCart.id));

    return { success: true, data: undefined };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to merge cart";
    return { success: false, error: message };
  }
}

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