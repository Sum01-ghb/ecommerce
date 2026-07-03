import { Suspense } from "react";
import Link from "next/link";
import { CheckCircle, Clock } from "lucide-react";
import { stripe } from "@/lib/stripe/client";
import { getOrder } from "@/lib/actions/orders";
import { db } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import OrderSuccess from "@/components/OrderSuccess";
import type { OrderDetail } from "@/lib/actions/orders";

export const dynamic = "force-dynamic";

async function findOrderByStripeSession(
  sessionId: string,
): Promise<OrderDetail | null> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) return null;

    const [paymentRow] = await db
      .select({ orderId: payments.orderId })
      .from(payments)
      .where(eq(payments.transactionId, paymentIntentId))
      .limit(1);

    if (!paymentRow) return null;

    const result = await getOrder(paymentRow.orderId);
    return result.success ? result.data : null;
  } catch (err) {
    console.error("[success page] Error resolving order:", err);
    return null;
  }
}

function PendingOrder({ sessionId }: { sessionId: string | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center max-w-md mx-auto px-4">
      <div className="rounded-full bg-orange/10 p-5">
        <Clock size={40} className="text-orange" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-heading-3 font-medium text-dark-900 mb-2">
          Order Processing
        </h1>
        <p className="text-body text-dark-700">
          Your payment was successful. We&apos;re finalising your order — this
          usually takes a few seconds.
        </p>
      </div>
      {sessionId && (
        <p className="text-footnote text-dark-500 font-mono break-all bg-light-200 px-3 py-2 rounded-sm w-full">
          {sessionId}
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Link
          href="/products"
          className="
            flex-1 flex items-center justify-center
            rounded-full bg-dark-900 text-light-100
            py-3.5 text-caption font-medium
            hover:bg-black transition-colors duration-150
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
          "
        >
          Home
        </Link>
      </div>
    </div>
  );
}

function GenericConfirmation() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center max-w-md mx-auto px-4">
      <div className="rounded-full bg-green/10 p-5">
        <CheckCircle size={40} className="text-green" aria-hidden="true" />
      </div>
      <div>
        <h1 className="text-heading-3 font-medium text-dark-900 mb-2">
          Payment Successful
        </h1>
        <p className="text-body text-dark-700">
          Thank you for your purchase! You&apos;ll receive a confirmation email
          shortly.
        </p>
      </div>
      <Link
        href="/products"
        className="
          rounded-full bg-dark-900 text-light-100
          px-8 py-3.5 text-caption font-medium
          hover:bg-black transition-colors duration-150
        "
      >
        Continue Shopping
      </Link>
    </div>
  );
}

interface SuccessContentProps {
  sessionId: string | undefined;
  orderId: string | undefined;
}

async function SuccessContent({ sessionId, orderId }: SuccessContentProps) {
  let order: OrderDetail | null = null;

  if (orderId) {
    const result = await getOrder(orderId);
    order = result.success ? result.data : null;
  }

  if (!order && sessionId) {
    order = await findOrderByStripeSession(sessionId);
  }

  if (!order) {
    return <PendingOrder sessionId={sessionId} />;
  }

  return <OrderSuccess order={order} />;
}

interface SuccessPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;

  const sessionId = Array.isArray(params.session_id)
    ? params.session_id[0]
    : params.session_id;

  const orderId = Array.isArray(params.order_id)
    ? params.order_id[0]
    : params.order_id;

  if (!sessionId && !orderId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <GenericConfirmation />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-light-200">
      <Suspense
        fallback={
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-10 h-10 rounded-full border-4 border-light-300 border-t-dark-900 animate-spin"
                aria-label="Loading order details"
              />
              <p className="text-caption text-dark-700">Loading your order…</p>
            </div>
          </div>
        }
      >
        <SuccessContent sessionId={sessionId} orderId={orderId} />
      </Suspense>
    </div>
  );
}