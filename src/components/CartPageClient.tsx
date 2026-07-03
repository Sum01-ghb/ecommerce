"use client";

/**
 * CartPageClient.tsx
 *
 * Interactive cart page content.
 * - Initializes the Zustand store from SSR-fetched items.
 * - Renders the item list and order summary.
 * - Handles checkout redirect: guests → /sign-in, users → /checkout.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCartStore, type CartItem } from "@/store/cart.store";
import CartItemRow from "@/components/CartItemRow";
import { clearCart } from "@/lib/actions/cart";
import { getCurrentUser } from "@/lib/auth/actions";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const DELIVERY_FEE_CENTS = 200; // $2.00 flat rate (waived when subtotal > $5000 / $50)
const FREE_DELIVERY_THRESHOLD = 5000; // cents

function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ─────────────────────────────────────────────────────────────────────────────
// Order Summary sidebar
// ─────────────────────────────────────────────────────────────────────────────

interface OrderSummaryProps {
  subtotalCents: number;
  onCheckout: () => void;
  isCheckingOut: boolean;
}

function OrderSummary({ subtotalCents, onCheckout, isCheckingOut }: OrderSummaryProps) {
  const deliveryFee =
    subtotalCents >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_CENTS;
  const total = subtotalCents + deliveryFee;

  return (
    <aside
      aria-label="Order summary"
      className="
        w-full lg:w-80 xl:w-96 flex-shrink-0
        bg-light-100 border border-light-300 rounded-sm p-6
        h-fit sticky top-24
      "
    >
      <h2 className="text-body-medium font-medium text-dark-900 mb-5">
        Summary
      </h2>

      <div className="space-y-3 mb-5">
        {/* Subtotal */}
        <div className="flex justify-between items-center">
          <span className="text-body text-dark-900">Subtotal</span>
          <span className="text-caption font-medium text-dark-900">
            {formatPrice(subtotalCents)}
          </span>
        </div>

        {/* Delivery */}
        <div className="flex justify-between items-center">
          <span className="text-body text-dark-900">
            Estimated Delivery &amp; Handling
          </span>
          <span className="text-caption font-medium text-dark-900">
            {deliveryFee === 0 ? (
              <span className="text-green">Free</span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-light-300 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-body-medium font-medium text-dark-900">Total</span>
            <span className="text-body-medium font-medium text-dark-900">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Free delivery notice */}
      {subtotalCents < FREE_DELIVERY_THRESHOLD && (
        <p className="text-footnote text-dark-700 mb-4">
          Add{" "}
          <span className="font-medium">
            {formatPrice(FREE_DELIVERY_THRESHOLD - subtotalCents)}
          </span>{" "}
          more for free delivery.
        </p>
      )}

      {/* Checkout CTA */}
      <button
        onClick={onCheckout}
        disabled={isCheckingOut || subtotalCents === 0}
        className="
          w-full flex items-center justify-center gap-2
          rounded-full bg-dark-900 text-light-100
          py-4 text-caption font-medium
          hover:bg-black transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isCheckingOut ? "Redirecting…" : "Proceed to Checkout"}
        {!isCheckingOut && <ArrowRight size={14} aria-hidden="true" />}
      </button>

      <p className="text-footnote text-center text-dark-500 mt-3">
        Taxes calculated at checkout
      </p>
    </aside>
  );
}

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
}

export default function CartPageClient({ initialItems }: CartPageClientProps) {
  const { items, setItems } = useCartStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

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

  async function handleCheckout() {
    setIsCheckingOut(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        // Guest → redirect to sign-in with callbackUrl
        router.push("/sign-in?callbackUrl=/cart");
      } else {
        // Logged in → go to checkout (placeholder)
        router.push("/checkout");
      }
    } finally {
      setIsCheckingOut(false);
    }
  }

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

      {/* ── Order summary ────────────────────────────────────────────────── */}
      <OrderSummary
        subtotalCents={subtotalCents}
        onCheckout={handleCheckout}
        isCheckingOut={isCheckingOut}
      />
    </div>
  );
}
