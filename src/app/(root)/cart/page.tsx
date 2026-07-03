/**
 * /cart — Cart Page
 *
 * Architecture
 * ────────────
 * This is a server component that fetches the initial cart data server-side
 * and passes it to a client component for interactive updates.
 *
 * Layout (matches design screenshot)
 * ───────────────────────────────────
 * Desktop: cart items list (left, ~65%) + summary sidebar (right, ~35%)
 * Mobile/Tablet: single column — items on top, summary below
 */

import { Suspense } from "react";
import { getCart }  from "@/lib/actions/cart";
import CartPageClient from "@/components/CartPageClient";
import CartPageSkeleton from "@/components/CartPageSkeleton";

export const dynamic = "force-dynamic";

async function CartPageData() {
  const result = await getCart();
  const initialItems = result.success ? result.data : [];

  return <CartPageClient initialItems={initialItems} />;
}

export default function CartPage() {
  return (
    <div className="flex-1 mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-16 py-8 lg:py-12">
      {/* Page title */}
      <h1 className="text-heading-3 font-medium text-dark-900 mb-8">Cart</h1>

      <Suspense fallback={<CartPageSkeleton />}>
        <CartPageData />
      </Suspense>
    </div>
  );
}
