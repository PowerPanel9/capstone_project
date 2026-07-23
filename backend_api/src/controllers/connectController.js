// connectController.js
// Stripe Connect onboarding for PROVIDERS. A provider needs a Stripe "connected
// account" (Express) before they can receive payouts. This controller creates
// that account and hands back a Stripe-hosted onboarding link.
//
// TEST MODE: with sk_test_ keys, accounts + onboarding are all fake/sandbox.

const stripe = require("../utils/stripe");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Where Stripe sends the provider back after onboarding. The frontend shows a
// "you're all set / finish setup" screen at these paths.
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// POST /api/connect/onboard
// Creates an Express connected account for the logged-in provider (if they
// don't already have one), then returns an onboarding link to complete setup.
async function startOnboarding(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Reuse the provider's existing connected account, or create one.
    let accountId = user.stripeAccountId;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        capabilities: {
          transfers: { requested: true }, // needed to receive payouts
        },
        business_type: "individual",
        metadata: { appUserId: String(userId) },
      });
      accountId = account.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeAccountId: accountId },
      });
    }

    // A single-use onboarding link. `refresh_url` is hit if the link expires;
    // `return_url` is where Stripe sends them when they finish.
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${FRONTEND_URL}/connect/refresh`,
      return_url: `${FRONTEND_URL}/connect/return`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (error) {
    console.error("startOnboarding error:", error.message);
    return res.status(500).json({ error: "Could not start Stripe onboarding" });
  }
}

// GET /api/connect/status
// Reports whether the logged-in provider has finished onboarding and can
// receive payouts (payouts_enabled / charges_enabled from Stripe).
async function getOnboardingStatus(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.stripeAccountId) {
      return res.status(200).json({ onboarded: false, hasAccount: false });
    }

    const account = await stripe.accounts.retrieve(user.stripeAccountId);
    return res.status(200).json({
      hasAccount: true,
      onboarded: account.details_submitted && account.payouts_enabled,
      payoutsEnabled: account.payouts_enabled,
      chargesEnabled: account.charges_enabled,
    });
  } catch (error) {
    console.error("getOnboardingStatus error:", error.message);
    return res.status(500).json({ error: "Could not fetch onboarding status" });
  }
}

module.exports = {
  startOnboarding,
  getOnboardingStatus,
};
