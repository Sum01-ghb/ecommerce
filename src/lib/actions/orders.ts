"use server";

import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  addresses,
  payments,
  carts,
  cartItems,
  productVariants,
  products,
  productImages,
  categories,
  genders,
  sizes,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { CartActionResult } from "./cart";
import type Stripe from "stripe";

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  sizeName: string;
  imageUrl: string;
  quantity: number;
  priceAtPurchase: number; 
}

export interface OrderDetail {
  id: string;
  userId: string;
  status: string;
  totalAmount: number; 
  createdAt: Date;
  items: OrderLineItem[];

  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export async function createOrder(
  session: Stripe.Checkout.Session
): Promise<CartActionResult<{ orderId: string }>> {
  try {
    const userId = session.metadata?.userId;
    const cartId = session.metadata?.cartId;

    if (!userId || !cartId) {
      return { success: false, error: "Missing userId or cartId in session metadata" };
    }

    const items = await db
      .select({
        productVariantId: cartItems.productVariantId,
        quantity: cartItems.quantity,
        price: productVariants.price,
        salePrice: productVariants.salePrice,
      })
      .from(cartItems)
      .innerJoin(productVariants, eq(cartItems.productVariantId, productVariants.id))
      .where(eq(cartItems.cartId, cartId));

    if (items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    const shipping = session.shipping_details || session.customer_details;
    if (!shipping?.address) {
      return { success: false, error: "No shipping address found in Stripe session" };
    }

    const shippingAddr = shipping.address;
    const [shippingAddressRow] = await db
      .insert(addresses)
      .values({
        userId,
        type: "shipping",
        line1: shippingAddr.line1 ?? "N/A",
        line2: shippingAddr.line2,
        city: shippingAddr.city ?? "N/A",
        state: shippingAddr.state ?? "N/A",
        country: shippingAddr.country ?? "N/A",
        postalCode: shippingAddr.postal_code ?? "N/A",
        isDefault: false,
      })
      .returning({ id: addresses.id });

    const [billingAddressRow] = await db
      .insert(addresses)
      .values({
        userId,
        type: "billing",
        line1: shippingAddr.line1 ?? "N/A",
        line2: shippingAddr.line2,
        city: shippingAddr.city ?? "N/A",
        state: shippingAddr.state ?? "N/A",
        country: shippingAddr.country ?? "N/A",
        postalCode: shippingAddr.postal_code ?? "N/A",
        isDefault: false,
      })
      .returning({ id: addresses.id });

    const totalCents = session.amount_total ?? 0;
    const totalDollars = (totalCents / 100).toFixed(2);

    const [order] = await db
      .insert(orders)
      .values({
        userId,
        status: "paid",
        totalAmount: totalDollars,
        shippingAddressId: shippingAddressRow.id,
        billingAddressId: billingAddressRow.id,
      })
      .returning({ id: orders.id });

    const lineItems = items.map((item) => ({
      orderId: order.id,
      productVariantId: item.productVariantId,
      quantity: item.quantity,
      priceAtPurchase: item.salePrice ?? item.price,
    }));

    await db.insert(orderItems).values(lineItems);

    await db.insert(payments).values({
      orderId: order.id,
      method: "stripe",
      status: "completed",
      paidAt: new Date(),
      transactionId: session.payment_intent as string,
    });

    await db.delete(cartItems).where(eq(cartItems.cartId, cartId));

    return { success: true, data: { orderId: order.id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create order";
    console.error("[createOrder] error:", err);
    return { success: false, error: message };
  }
}

export async function getOrder(
  orderId: string
): Promise<CartActionResult<OrderDetail | null>> {
  try {

    const [order] = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        status: orders.status,
        totalAmount: orders.totalAmount,
        createdAt: orders.createdAt,
        shippingAddressId: orders.shippingAddressId,
      })
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return { success: true, data: null };
    }

    const [shippingAddress] = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, order.shippingAddressId))
      .limit(1);

    if (!shippingAddress) {
      return { success: false, error: "Shipping address not found" };
    }

    const rows = await db
      .select({
        orderItemId: orderItems.id,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        productId: products.id,
        productName: products.name,
        categoryName: categories.name,
        genderLabel: genders.label,
        sizeName: sizes.name,
        imageUrl: productImages.url,
      })
      .from(orderItems)
      .innerJoin(productVariants, eq(orderItems.productVariantId, productVariants.id))
      .innerJoin(products, eq(productVariants.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .innerJoin(genders, eq(products.genderId, genders.id))
      .innerJoin(sizes, eq(productVariants.sizeId, sizes.id))
      .leftJoin(
        productImages,
        and(eq(productImages.productId, products.id), eq(productImages.isPrimary, true))
      )
      .where(eq(orderItems.orderId, orderId));

    const items: OrderLineItem[] = rows.map((r) => ({
      id: r.orderItemId,
      productId: r.productId,
      productName: r.productName,
      category: `${r.genderLabel}'s ${r.categoryName}`,
      sizeName: r.sizeName,
      imageUrl: r.imageUrl ?? "/shoes/shoe-1.jpg",
      quantity: r.quantity,
      priceAtPurchase: Math.round(parseFloat(r.priceAtPurchase) * 100), 
    }));

    const orderDetail: OrderDetail = {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalAmount: Math.round(parseFloat(order.totalAmount) * 100), 
      createdAt: order.createdAt,
      items,
      shippingAddress: {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
      },
    };

    return { success: true, data: orderDetail };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch order";
    console.error("[getOrder] error:", err);
    return { success: false, error: message };
  }
}