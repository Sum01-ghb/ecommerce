/**
 * OrderSuccess.tsx — Post-checkout success UI
 *
 * Displayed on /checkout/success after Stripe redirects the user back.
 * Shows:
 *   • A confirmation header with the order ID
 *   • Each purchased line item (image, name, size, qty, price)
 *   • Order totals
 *   • Shipping address summary
 *   • CTAs: continue shopping / view orders
 *
 * This is a pure presentational component — data is fetched in the
 * server component (success/page.tsx) and passed in as props.
 */

import Image from "next/image";
import Link from "next/link";
import { CheckCircle, MapPin, Package } from "lucide-react";
import type { OrderDetail } from "@/lib/actions/orders";

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

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ConfirmationHeader({ orderId }: { orderId: string }) {
  const shortId = orderId.slice(0, 8).toUpperCase();
  return (
    <div className="flex flex-col items-center text-center gap-4 py-8 border-b border-light-300">
      <div className="rounded-full bg-green/10 p-5">
        <CheckCircle size={40} className="text-green" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-heading-3 font-medium text-dark-900">
          Order Confirmed!
        </h1>
        <p className="text-caption text-dark-700 mt-1">
          Thank you for your purchase. We&apos;re preparing your order.
        </p>
      </div>
      <div className="bg-light-200 rounded-sm px-4 py-2 text-center">
        <p className="text-footnote text-dark-700">Order ID</p>
        <p className="text-body-medium font-medium text-dark-900 font-mono">
          #{shortId}
        </p>
      </div>
    </div>
  );
}

function OrderLineItemRow({ item }: { item: OrderDetail["items"][0] }) {
  return (
    <div className="flex gap-4 py-5 border-b border-light-300 last:border-b-0">
      {/* Image */}
      <Link
        href={`/products/${item.productId}`}
        className="flex-shrink-0 w-20 h-20 rounded-sm overflow-hidden bg-light-200 block"
        aria-label={`View ${item.productName}`}
      >
        <Image
          src={item.imageUrl}
          alt={item.productName}
          width={80}
          height={80}
          className="w-full h-full object-cover object-center"
        />
      </Link>

      {/* Details */}
      <div className="flex-1 flex justify-between gap-2 min-w-0">
        <div className="min-w-0">
          <p className="text-caption font-medium text-dark-900 line-clamp-2">
            {item.productName}
          </p>
          <p className="text-footnote text-dark-700 mt-0.5">{item.category}</p>
          <div className="flex gap-3 mt-1.5 flex-wrap">
            <span className="text-footnote text-dark-500">
              Size{" "}
              <span className="font-medium text-dark-900">{item.sizeName}</span>
            </span>
            <span className="text-footnote text-dark-500">
              Qty{" "}
              <span className="font-medium text-dark-900">{item.quantity}</span>
            </span>
          </div>
        </div>
        <p className="text-caption font-medium text-dark-900 whitespace-nowrap flex-shrink-0">
          {formatPrice(item.priceAtPurchase * item.quantity)}
        </p>
      </div>
    </div>
  );
}

function ShippingAddressSummary({
  address,
}: {
  address: OrderDetail["shippingAddress"];
}) {
  return (
    <div className="bg-light-100 border border-light-300 rounded-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-dark-700" aria-hidden="true" />
        <p className="text-caption font-medium text-dark-900">
          Shipping Address
        </p>
      </div>
      <address className="not-italic text-caption text-dark-700 leading-relaxed space-y-0.5">
        <p>{address.line1}</p>
        {address.line2 && <p>{address.line2}</p>}
        <p>
          {address.city}, {address.state} {address.postalCode}
        </p>
        <p>{address.country}</p>
      </address>
    </div>
  );
}

function OrderTotals({ order }: { order: OrderDetail }) {
  const DELIVERY_FEE_CENTS = 200;
  const FREE_THRESHOLD = 5000;

  const subtotal = order.items.reduce(
    (acc, item) => acc + item.priceAtPurchase * item.quantity,
    0
  );
  const deliveryFee = subtotal >= FREE_THRESHOLD ? 0 : DELIVERY_FEE_CENTS;

  return (
    <div className="bg-light-100 border border-light-300 rounded-sm p-5 space-y-3">
      <p className="text-caption font-medium text-dark-900 mb-1">
        Order Summary
      </p>

      <div className="flex justify-between text-body text-dark-700">
        <span>Subtotal</span>
        <span className="text-dark-900 font-medium">{formatPrice(subtotal)}</span>
      </div>

      <div className="flex justify-between text-body text-dark-700">
        <span>Delivery &amp; Handling</span>
        <span className="text-dark-900 font-medium">
          {deliveryFee === 0 ? (
            <span className="text-green">Free</span>
          ) : (
            formatPrice(deliveryFee)
          )}
        </span>
      </div>

      <div className="border-t border-light-300 pt-3 flex justify-between">
        <span className="text-body-medium font-medium text-dark-900">Total</span>
        <span className="text-body-medium font-medium text-dark-900">
          {formatPrice(order.totalAmount)}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

interface OrderSuccessProps {
  order: OrderDetail;
}

export default function OrderSuccess({ order }: OrderSuccessProps) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      {/* Confirmation header */}
      <ConfirmationHeader orderId={order.id} />

      {/* Order date */}
      <p className="text-footnote text-dark-700 text-center mt-4 mb-6">
        Placed on {formatDate(order.createdAt)}
      </p>

      {/* Two-column layout on sm+ */}
      <div className="flex flex-col gap-6">
        {/* Left / top: items */}
        <section aria-label="Ordered items">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-dark-700" aria-hidden="true" />
            <h2 className="text-caption font-medium text-dark-900">
              Items ({order.items.length})
            </h2>
          </div>
          <div className="bg-light-100 border border-light-300 rounded-sm px-4 sm:px-5">
            {order.items.map((item) => (
              <OrderLineItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>

        {/* Right / bottom: totals + shipping */}
        <div className="flex flex-col gap-4">
          <OrderTotals order={order} />
          <ShippingAddressSummary address={order.shippingAddress} />
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href="/products"
            className="
              flex-1 flex items-center justify-center
              rounded-full bg-dark-900 text-light-100
              py-3.5 text-caption font-medium
              hover:bg-black transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
            "
          >
            Continue Shopping
          </Link>
          <Link
            href="/"
            className="
              flex-1 flex items-center justify-center
              rounded-full border border-light-400 bg-light-100 text-dark-900
              py-3.5 text-caption font-medium
              hover:border-dark-700 hover:bg-light-200 transition-colors duration-150
              focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
            "
          >
            Back to Home
          </Link>
        </div>

        {/* Support note */}
        <p className="text-footnote text-center text-dark-500">
          Questions about your order?{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-dark-900 transition-colors">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
