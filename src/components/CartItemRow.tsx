"use client";

/**
 * CartItemRow.tsx
 *
 * A single cart item row for the /cart page.
 * Matches the design: image | details + size/qty | price | delete.
 * Handles optimistic UI updates with server action confirmation.
 */

import Image from "next/image";
import Link  from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { useCartStore, type CartItem } from "@/store/cart.store";
import { updateCartItem, removeCartItem } from "@/lib/actions/cart";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

interface CartItemRowProps {
  item: CartItem;
}

export default function CartItemRow({ item }: CartItemRowProps) {
  const [isPending, startTransition] = useTransition();
  const { updateItemQuantity, removeItem } = useCartStore();

  function handleQuantityChange(delta: number) {
    const newQty = item.quantity + delta;

    // Optimistic update
    if (newQty <= 0) {
      removeItem(item.cartItemDbId);
    } else {
      updateItemQuantity(item.cartItemDbId, newQty);
    }

    startTransition(async () => {
      if (newQty <= 0) {
        await removeCartItem(item.cartItemDbId);
      } else {
        await updateCartItem(item.cartItemDbId, newQty);
      }
    });
  }

  function handleRemove() {
    // Optimistic update
    removeItem(item.cartItemDbId);

    startTransition(async () => {
      await removeCartItem(item.cartItemDbId);
    });
  }

  const lineTotal = item.price * item.quantity;

  return (
    <div
      className={`flex gap-4 py-6 border-b border-light-300 last:border-b-0 transition-opacity ${
        isPending ? "opacity-60" : "opacity-100"
      }`}
    >
      {/* ── Thumbnail ─────────────────────────────────────────────────── */}
      <Link
        href={`/products/${item.productId}`}
        className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-sm overflow-hidden bg-light-200 block cursor-pointer"
        aria-label={`View ${item.name}`}
      >
        <Image
          src={item.imageUrl}
          alt={item.name}
          width={112}
          height={112}
          className="w-full h-full object-cover object-center"
        />
      </Link>

      {/* ── Details ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 gap-2 justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          {/* Product name */}
          <Link
            href={`/products/${item.productId}`}
            className="text-body-medium font-medium text-dark-900 hover:underline line-clamp-2 cursor-pointer"
          >
            {item.name}
          </Link>

          {/* Category */}
          <p className="text-caption text-dark-700">{item.category}</p>

          {/* Size + quantity controls */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-auto pt-2">
            {/* Size */}
            <p className="text-caption text-dark-900">
              <span className="text-dark-700">Size</span>{" "}
              <span className="font-medium">{item.sizeName}</span>
            </p>

            {/* Qty controls */}
            <div className="flex items-center gap-1">
              <span className="text-caption text-dark-700 mr-1">Quantity</span>
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={isPending}
                aria-label="Decrease quantity"
                className="
                  w-6 h-6 flex items-center justify-center
                  border border-light-400 rounded-sm text-dark-700
                  hover:border-dark-900 hover:text-dark-900 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <Minus size={11} />
              </button>
              <span className="text-caption font-medium text-dark-900 w-6 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={isPending || item.quantity >= item.inStock}
                aria-label="Increase quantity"
                className="
                  w-6 h-6 flex items-center justify-center
                  border border-light-400 rounded-sm text-dark-700
                  hover:border-dark-900 hover:text-dark-900 cursor-pointer
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                <Plus size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: price + delete ───────────────────────────────────── */}
        <div className="flex flex-col items-end justify-between flex-shrink-0 ml-2">
          <span className="text-body-medium font-medium text-dark-900 whitespace-nowrap">
            {formatPrice(lineTotal)}
          </span>
          <button
            onClick={handleRemove}
            disabled={isPending}
            aria-label={`Remove ${item.name} from cart`}
            className="
              text-red/70 hover:text-red transition-colors cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}
