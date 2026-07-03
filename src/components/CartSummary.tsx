"use client";

/**
 * CartSummary.tsx — Order summary sidebar with Stripe Checkout button
 *
 * Auth-aware checkout flow
 * ────────────────────────
 * • Guest (isAuthenticated=false): clicking "Proceed to Checkout" immediately
 *   redirects to /sign-in?callbackUrl=/cart — no server action is called,
 *   no Stripe session is created, no email field is shown.
 * • Authenticated: calls createStripeCheckoutSession() and redirects to
 *   Stripe's hosted checkout page.
 *
 * isAuthenticated is resolved server-side in cart/page.tsx so there is
 * zero flicker and no client-side auth round-trip before the redirect.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, AlertCircle, LogIn } from "lucide-react";
import { createStripeCheckoutSession } from "@/lib/actions/checkout";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DELIVERY_FEE_CENTS = 200;
const FREE_DELIVERY_THRESHOLD = 5000; // $50.00

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
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface CartSummaryProps {
  subtotalCents: number;
  itemCount: number;
  /** Resolved server-side — true when a valid auth session exists */
  isAuthenticated: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function CartSummary({
  subtotalCents,
  itemCount,
  isAuthenticated,
}: CartSummaryProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const deliveryFee =
    subtotalCents >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE_CENTS;
  const total = subtotalCents + deliveryFee;
  const isEmpty = itemCount === 0 || subtotalCents === 0;

  // ── Checkout handler ──────────────────────────────────────────────────────
  async function handleCheckout() {
    if (isEmpty || isLoading) return;

    // Guest: redirect to sign-in immediately — never touch Stripe
    if (!isAuthenticated) {
      router.push("/sign-in?callbackUrl=/cart");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await createStripeCheckoutSession();

      if (!result.success) {
        // Fallback: if auth somehow expired between page load and click
        if (result.redirect) {
          router.push(result.redirect);
          return;
        }
        setError(result.error);
        return;
      }

      // Hard-navigate to Stripe hosted checkout page
      window.location.href = result.url;
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <aside
      aria-label="Order summary"
      className="
        w-full lg:w-80 xl:w-96 flex-shrink-0
        bg-light-100 border border-light-300 rounded-sm p-6
        h-fit sticky top-24
      "
    >
      {/* Title */}
      <h2 className="text-body-medium font-medium text-dark-900 mb-5">
        Summary
      </h2>

      {/* Line items */}
      <div className="space-y-3 mb-5">
        <div className="flex justify-between items-center">
          <span className="text-body text-dark-900">Subtotal</span>
          <span className="text-caption font-medium text-dark-900">
            {formatPrice(subtotalCents)}
          </span>
        </div>

        <div className="flex justify-between items-start gap-4">
          <span className="text-body text-dark-900 leading-snug">
            Estimated Delivery &amp; Handling
          </span>
          <span className="text-caption font-medium text-dark-900 whitespace-nowrap flex-shrink-0">
            {deliveryFee === 0 ? (
              <span className="text-green">Free</span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>

        <div className="border-t border-light-300 pt-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-body-medium font-medium text-dark-900">
              Total
            </span>
            <span className="text-body-medium font-medium text-dark-900">
              {formatPrice(total)}
            </span>
          </div>
          <p className="text-footnote text-dark-500">
            Tax included where applicable
          </p>
        </div>
      </div>

      {/* Free delivery nudge */}
      {subtotalCents > 0 && subtotalCents < FREE_DELIVERY_THRESHOLD && (
        <p className="text-footnote text-dark-700 bg-light-200 rounded-sm px-3 py-2 mb-4">
          Add{" "}
          <span className="font-medium text-dark-900">
            {formatPrice(FREE_DELIVERY_THRESHOLD - subtotalCents)}
          </span>{" "}
          more for free delivery.
        </p>
      )}

      {/* Sign-in nudge for guests */}
      {!isAuthenticated && !isEmpty && (
        <div className="flex items-start gap-2 rounded-sm bg-light-200 border border-light-300 px-3 py-2.5 mb-4">
          <LogIn size={15} className="flex-shrink-0 text-dark-700 mt-0.5" aria-hidden="true" />
          <p className="text-footnote text-dark-700 leading-snug">
            You&apos;ll be asked to sign in before completing your purchase.
          </p>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-sm bg-red/5 border border-red/20 px-3 py-2.5 mb-4"
        >
          <AlertCircle
            size={15}
            className="flex-shrink-0 text-red mt-0.5"
            aria-hidden="true"
          />
          <p className="text-footnote text-red leading-snug">{error}</p>
        </div>
      )}

      {/* CTA button — label changes for guests */}
      <button
        onClick={handleCheckout}
        disabled={isEmpty || isLoading}
        aria-label={
          isEmpty
            ? "Your cart is empty"
            : !isAuthenticated
            ? "Sign in to checkout"
            : isLoading
            ? "Redirecting to Stripe Checkout…"
            : "Proceed to Stripe Checkout"
        }
        className="
          w-full flex items-center justify-center gap-2
          rounded-full bg-dark-900 text-light-100
          py-4 text-caption font-medium
          hover:bg-black transition-colors duration-150
          focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <>
            <span
              className="inline-block w-4 h-4 rounded-full border-2 border-light-100/30 border-t-light-100 animate-spin"
              aria-hidden="true"
            />
            Redirecting…
          </>
        ) : !isAuthenticated ? (
          <>
            <LogIn size={14} aria-hidden="true" />
            Sign in to Checkout
          </>
        ) : (
          <>
            Proceed to Checkout
            <ArrowRight size={14} aria-hidden="true" />
          </>
        )}
      </button>

      {/* Trust badge — only shown to authenticated users going to Stripe */}
      {isAuthenticated && (
        <div className="flex items-center justify-center gap-1.5 mt-3">
          <Lock size={11} className="text-dark-500" aria-hidden="true" />
          <p className="text-footnote text-dark-500">Secured by Stripe</p>
        </div>
      )}
    </aside>
  );
}
