"use client";

/**
 * CartPageClient.tsx
 *
 * Interactive cart page content.
 * - Initializes the Zustand store from SSR-fetched items.
 * - Renders the item list and CartSummary sidebar (with Stripe integration).
 */

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cart.store";
import CartItemRow from "@/components/CartItemRow";
import CartSummary from "@/components/CartSummary";
import { clearCart } from "@/lib/actions/cart";

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-5">
      <div className="rounded-full bg-light-200 p-7">
        <ShoppingBag size={44} className="text-light-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-body-medium font-medium text-dark-900 mb-1">
          Your cart is empty
        </p>
        <p className="text-caption text-dark-700">
          Looks like you haven&apos;t added anything yet.
        </p>
      </div>
      <Link
        href="/products"
        className="
          inline-flex items-center gap-1.5 rounded-full bg-dark-900
          px-6 py-3 text-caption font-medium text-light-100
          hover:bg-black transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
        "
      >
        Shop Now
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main client component
// ─────────────────────────────────────────────────────────────────────────────

interface CartPageClientProps {
  initialItems: CartItem[];
  isAuthenticated: boolean;
}

export default function CartPageClient({ initialItems, isAuthenticated }: CartPageClientProps) {
  const { items, setItems } = useCartStore();

  // Hydrate store with SSR data on first render
  useEffect(() => {
    setItems(initialItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use store items (live) after hydration; fall back to SSR data on very first render
  const displayItems = items.length > 0 ? items : initialItems;

  const subtotalCents = displayItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  async function handleClearCart() {
    setItems([]);
    await clearCart();
  }

  if (displayItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
      {/* ── Items list ──────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* List header */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-caption text-dark-700">
            {displayItems.length}{" "}
            {displayItems.length === 1 ? "item" : "items"}
          </p>
          <button
            onClick={handleClearCart}
            className="text-footnote text-dark-500 hover:text-red underline underline-offset-2 transition-colors"
          >
            Remove all
          </button>
        </div>

        {/* Cart rows */}
        <div className="bg-light-100 border border-light-300 rounded-sm px-4 sm:px-6">
          {displayItems.map((item) => (
            <CartItemRow key={item.cartItemDbId} item={item} />
          ))}
        </div>

        {/* Continue shopping */}
        <div className="mt-5">
          <Link
            href="/products"
            className="
              inline-flex items-center gap-1.5 text-caption text-dark-700
              hover:text-dark-900 underline underline-offset-2 transition-colors
            "
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>

      {/* ── Order summary with Stripe Checkout ─────────────────────────── */}
      <CartSummary
        subtotalCents={subtotalCents}
        itemCount={displayItems.length}
        isAuthenticated={isAuthenticated}
      />
    </div>
  );
}
