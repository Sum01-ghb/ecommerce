"use client";

/**
 * CartDrawer.tsx
 *
 * Slide-in cart drawer (right side).
 * Reads from the Zustand cart store (cart.store.ts) and calls
 * server actions for update/remove operations.
 *
 * The drawer mirrors the cart page: quantity controls + trash icon per item.
 * Footer: subtotal + "View Cart" link + "Checkout" button.
 */

import React, { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Single drawer item
// ─────────────────────────────────────────────────────────────────────────────

function DrawerItem({
  item,
}: {
  item: ReturnType<typeof useCartStore.getState>["items"][0];
}) {
  const [isPending, startTransition] = useTransition();
  const { updateItemQuantity, removeItem } = useCartStore();

  function handleQty(delta: number) {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(item.cartItemDbId);
      startTransition(async () => { await removeCartItem(item.cartItemDbId); });
    } else {
      updateItemQuantity(item.cartItemDbId, newQty);
      startTransition(async () => { await updateCartItem(item.cartItemDbId, newQty); });
    }
  }

  function handleRemove() {
    removeItem(item.cartItemDbId);
    startTransition(async () => { await removeCartItem(item.cartItemDbId); });
  }

  return (
    <div
      className={`flex gap-4 border-b border-light-300 pb-6 last:border-0 last:pb-0 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}
    >
      {/* Thumbnail */}
      <Link
        href={`/products/${item.productId}`}
        className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm bg-light-200 block cursor-pointer"
        aria-label={item.name}
      >
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={80}
          height={80}
          className="h-full w-full object-cover object-center"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div className="flex justify-between gap-2">
          <div className="min-w-0">
            <p className="text-caption font-medium text-dark-900 line-clamp-2">{item.name}</p>
            <p className="text-footnote text-dark-700 mt-0.5">{item.category}</p>
            <p className="text-footnote text-dark-500 mt-0.5">Size {item.sizeName}</p>
          </div>
          <p className="text-caption font-medium text-dark-900 whitespace-nowrap flex-shrink-0">
            {formatPrice(item.price * item.quantity)}
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          {/* Qty controls */}
          <div className="flex items-center border border-light-400 rounded-sm">
            <button
              onClick={() => handleQty(-1)}
              disabled={isPending}
              className="p-1.5 text-dark-700 hover:text-dark-900 disabled:opacity-50 cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 text-caption text-dark-900">{item.quantity}</span>
            <button
              onClick={() => handleQty(1)}
              disabled={isPending || item.quantity >= item.inStock}
              className="p-1.5 text-dark-700 hover:text-dark-900 disabled:opacity-50 cursor-pointer"
              aria-label="Increase quantity"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={handleRemove}
            disabled={isPending}
            className="text-dark-500 hover:text-red transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Remove item"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────────────────────────────────────

export default function CartDrawer() {
  const { isOpen, items, setIsOpen } = useCartStore();

  if (!isOpen) return null;

  const subtotalCents = items.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md flex flex-col h-full bg-light-100 shadow-2xl border-l border-light-300">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-light-300">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className="text-dark-900" />
              <h2 className="text-body-medium font-medium text-dark-900">
                Shopping Cart
                {items.length > 0 && (
                  <span className="text-dark-500 font-normal ml-1">
                    ({items.length})
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-sm p-1.5 text-dark-500 hover:bg-light-200 hover:text-dark-900 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X size={20} />
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-16">
                <div className="rounded-full bg-light-200 p-6">
                  <ShoppingBag size={36} className="text-light-400" />
                </div>
                <div>
                  <p className="text-body-medium text-dark-900">Your cart is empty</p>
                  <p className="text-caption text-dark-700 mt-1">
                    Add items to begin your order.
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-sm border border-light-400 px-5 py-2.5 text-caption hover:bg-light-200 transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              items.map((item) => <DrawerItem key={item.cartItemDbId} item={item} />)
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-light-300 p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body text-dark-700">Subtotal</span>
                <span className="text-body-medium font-medium text-dark-900">
                  {formatPrice(subtotalCents)}
                </span>
              </div>
              <p className="text-footnote text-dark-500">
                Shipping and taxes calculated at checkout.
              </p>

              {/* View Cart */}
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="
                  w-full block text-center rounded-sm border border-dark-900
                  py-3 text-caption font-medium text-dark-900
                  hover:bg-light-200 transition-colors cursor-pointer
                "
              >
                View Cart
              </Link>

              {/* Checkout — goes to /cart where the Stripe checkout button lives */}
              <Link
                href="/cart"
                onClick={() => setIsOpen(false)}
                className="
                  w-full block text-center rounded-sm bg-dark-900
                  py-3.5 text-caption font-medium text-light-100
                  hover:bg-black transition-colors cursor-pointer
                "
              >
                Checkout
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
