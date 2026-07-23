// connectRoutes.js
// Stripe Connect onboarding routes for providers. The /api/connect prefix is
// added in src/index.js. Both routes require login.

const express = require("express");
const router = express.Router();

const {
  startOnboarding,
  getOnboardingStatus,
} = require("../controllers/connectController");

const { requireAuth } = require("../middleware/security");

// POST /api/connect/onboard -> create/reuse the provider's Express account and
// return a Stripe-hosted onboarding link.
router.post("/onboard", requireAuth, startOnboarding);

// GET /api/connect/status -> has the provider finished onboarding?
router.get("/status", requireAuth, getOnboardingStatus);

module.exports = router;
