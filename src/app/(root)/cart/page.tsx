/**
 * /cart — Cart Page
 *
 * The cart is accessible to all users (guests and authenticated).
 * Auth state is resolved server-side and passed down so CartSummary
 * can redirect guests to sign-in immediately — without hitting the
 * Stripe server action first.
 */

import { Suspense } from "react";
import { getCart }  from "@/lib/actions/cart";
import { getCurrentUser } from "@/lib/auth/actions";
import CartPageClient from "@/components/CartPageClient";
import CartPageSkeleton from "@/components/CartPageSkeleton";

export const dynamic = "force-dynamic";

async function CartPageData() {
  // Run both fetches in parallel — they are independent
  const [cartResult, user] = await Promise.all([
    getCart(),
    getCurrentUser(),
  ]);

  const initialItems = cartResult.success ? cartResult.data : [];
  const isAuthenticated = !!user;

  return (
    <CartPageClient
      initialItems={initialItems}
      isAuthenticated={isAuthenticated}
    />
  );
}

export default function CartPage() {
  return (
    <div className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-16 py-8 lg:py-12">
      <h1 className="text-heading-3 font-medium text-dark-900 mb-8">Cart</h1>

      <Suspense fallback={<CartPageSkeleton />}>
        <CartPageData />
      </Suspense>
    </div>
  );
}
