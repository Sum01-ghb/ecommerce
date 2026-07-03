/**
 * stripe/client.ts — Singleton Stripe instance
 *
 * Import this wherever you need the Stripe SDK (server-side only).
 * The secret key is read from STRIPE_SECRET_KEY at module load time;
 * an error is thrown at build time if the variable is missing so the
 * misconfiguration surfaces immediately rather than at runtime.
 */

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error(
    "Missing environment variable: STRIPE_SECRET_KEY. " +
      "Add it to your .env file and restart the dev server."
  );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // Pin to the version bundled with this package version
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});
