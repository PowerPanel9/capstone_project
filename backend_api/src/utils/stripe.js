// stripe.js
// One shared Stripe client for the whole backend, created from the secret key
// in .env. Import this everywhere instead of calling `new Stripe()` repeatedly.
//
// SAFETY: as long as STRIPE_SECRET_KEY starts with "sk_test_", every call here
// runs in Stripe TEST mode — no real money, cards, or bank accounts are touched.

const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  // Warn at startup. The app can still run; only Stripe features are disabled.
  console.warn("⚠️  STRIPE_SECRET_KEY is not set — Stripe features will not work.");
}

function createMissingStripeProxy(path = "stripe") {
  const fn = () => {
    throw new Error(
      `Stripe is not configured. Missing STRIPE_SECRET_KEY while calling ${path}.`
    );
  };

  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "then") return undefined; // keep it from looking like a Promise
      return createMissingStripeProxy(`${path}.${String(prop)}`);
    },
    apply() {
      throw new Error(
        `Stripe is not configured. Missing STRIPE_SECRET_KEY while calling ${path}().`
      );
    },
  });
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : createMissingStripeProxy();

module.exports = stripe;
