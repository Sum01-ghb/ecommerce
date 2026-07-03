import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "Missing environment variable: STRIPE_SECRET_KEY. " +
      "Add it to your .env file and restart the dev server."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {

  apiVersion: "2025-01-27.acacia",
  typescript: true,
});