import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { createOrder } from "@/lib/actions/orders";
import { db } from "@/lib/db";
import { payments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {

  const rawBody = await req.arrayBuffer();
  const bodyBuffer = Buffer.from(rawBody);

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

  try {
    switch (event.type) {

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : undefined;

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

        const result = await createOrder(session);

        if (!result.success) {

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

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const failureMessage = paymentIntent.last_payment_error?.message ?? "Unknown failure";

        console.error(
          `[stripe/webhook] Payment failed — payment_intent: ${paymentIntent.id} — reason: ${failureMessage}`
        );

        await db
          .update(payments)
          .set({ status: "failed" })
          .where(eq(payments.transactionId, paymentIntent.id));

        break;
      }

      default:

        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {

    console.error("[stripe/webhook] Unexpected handler error:", err);
    return NextResponse.json(
      { received: true, error: "Internal handler error" },
      { status: 200 }
    );
  }

  return NextResponse.json({ received: true });
}