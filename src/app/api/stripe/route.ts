/**
 * /api/stripe — Stripe Webhook Handler
 *
 * Security
 * ────────
 * Every incoming request is verified with the Stripe webhook signature using
 * STRIPE_WEBHOOK_SECRET. Unverified requests are rejected with HTTP 400.
 * Never trust any payload without a valid signature.
 *
 * Idempotency
 * ───────────
 * Before creating an order we check payments.transactionId for the
 * payment_intent ID. Duplicate webhook deliveries (Stripe sends at-least-once)
 * are silently acknowledged with 200 and not re-processed.
 *
 * Runtime
 * ───────
 * Must run on Node.js runtime — Edge runtime does not support Buffer which is
 * required by stripe.webhooks.constructEvent().
 *
 * Handled events
 * ──────────────
 * • checkout.session.completed   → createOrder (inserts order + payment + clears cart)
 * • payment_intent.payment_failed → logs failure, marks payment record as failed
 */

import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createOrder } from "@/lib/actions/orders";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Must be Node.js runtime — Edge does not support Buffer
export const runtime = "nodejs";

// Disable Next.js body parsing so we can read the raw body for signature verification
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // ── 1. Read raw body as Buffer ─────────────────────────────────────────────
  const rawBody = await req.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

  // ── 2. Verify Stripe signature ─────────────────────────────────────────────
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[stripe/webhook] Missing stripe-signature header");
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, signature, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Stripe signature verification failed";
    console.error("[stripe/webhook] Signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // ── 3. Route events ────────────────────────────────────────────────────────
  try {
    switch (event.type) {
      // ── checkout.session.completed ─────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined;

        // Idempotency: skip if we already processed this payment_intent
        if (paymentIntentId) {
          const [existingPayment] = await db
            .select({ id: payments.id })
            .from(payments)
            .where(eq(payments.transactionId, paymentIntentId))
            .limit(1);

          if (existingPayment) {
            console.log(
              `[stripe/webhook] Duplicate event for payment_intent ${paymentIntentId} — skipping`
            );
            return NextResponse.json({ received: true });
          }
        }

        // Create order, order items, payment record, and clear cart
        const result = await createOrder(session);

        if (!result.success) {
          // Log and acknowledge — do NOT return 5xx or Stripe will retry forever
          console.error("[stripe/webhook] createOrder failed:", result.error);
          return NextResponse.json(
            { received: true, warning: result.error },
            { status: 200 }
          );
        }

        console.log(
          `[stripe/webhook] ✓ Order created: ${result.data.orderId} (session: ${session.id})`
        );
        break;
      }

      // ── payment_intent.payment_failed ──────────────────────────────────────
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const failureMessage = paymentIntent.last_payment_error?.message ?? "Unknown failure";

        console.error(
          `[stripe/webhook] Payment failed — payment_intent: ${paymentIntent.id} — reason: ${failureMessage}`
        );

        // Update payment record if it exists
        await db
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.transactionId, paymentIntent.id));

        break;
      }

      // ── Unhandled events ───────────────────────────────────────────────────
      default:
        // Always log unhandled events for visibility
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Catch unexpected handler errors — return 200 so Stripe doesn't retry
    console.error("[stripe/webhook] Unexpected handler error:", err);
    return NextResponse.json(
      { received: true, error: "Internal handler error" },
      { status: 200 }
    );
  }

  return NextResponse.json({ received: true });
}
