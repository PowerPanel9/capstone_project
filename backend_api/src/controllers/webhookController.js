// webhookController.js
// Stripe sends events here (e.g. "the client's payment succeeded"). Webhooks are
// the RELIABLE way to confirm payments server-side — never trust the browser to
// tell us a payment succeeded.
//
// IMPORTANT: this handler needs the RAW request body to verify Stripe's
// signature, so in src/index.js it's mounted with express.raw() BEFORE the
// global express.json() middleware.

const stripe = require("../utils/stripe");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function handleStripeWebhook(req, res) {
  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (webhookSecret) {
      // Verify the event really came from Stripe (required in production).
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } else if (process.env.NODE_ENV === "production") {
      // Never accept unverified webhooks in production — reject outright.
      console.error("STRIPE_WEBHOOK_SECRET is not set in production. Rejecting webhook.");
      return res.status(500).send("Webhook secret not configured");
    } else {
      // Local dev convenience only: no secret set, parse raw JSON unverified.
      event = JSON.parse(req.body);
      console.warn("⚠️  STRIPE_WEBHOOK_SECRET not set — webhook signature NOT verified (dev only).");
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // The client's payment succeeded -> funds are now HELD on our balance.
      case "payment_intent.succeeded": {
        const intent = event.data.object;
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: intent.id, status: "PENDING" },
          data: { status: "HELD" },
        });
        console.log(`Payment held for intent ${intent.id}`);
        break;
      }

      // The payment failed -> leave/mark it so the client can retry.
      case "payment_intent.payment_failed": {
        const intent = event.data.object;
        console.log(`Payment failed for intent ${intent.id}`);
        break;
      }

      default:
        // Unhandled event types are fine to ignore.
        break;
    }

    // Always 200 so Stripe stops retrying once we've received it.
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handling error:", error.message);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

module.exports = { handleStripeWebhook };
