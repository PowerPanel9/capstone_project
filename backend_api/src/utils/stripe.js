// stripe.js
// One shared Stripe client for the whole backend, created from the secret key
// in .env. Import this everywhere instead of calling `new Stripe()` repeatedly.
//
// SAFETY: as long as STRIPE_SECRET_KEY starts with "sk_test_", every call here
// runs in Stripe TEST mode — no real money, cards, or bank accounts are touched.

const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  // Fail loudly at startup rather than getting confusing errors later.
  console.warn("⚠️  STRIPE_SECRET_KEY is not set — Stripe features will not work.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = stripe;
