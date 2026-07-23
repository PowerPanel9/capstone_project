// paymentsRoutes.js
// Payment routes for the marketplace money flow. The /api/payments prefix is
// added in src/index.js. All routes require login.

const express = require("express");
const router = express.Router();

const {
  createPaymentIntent,
  releasePayment,
  getPaymentForListing,
  generateInvoice,
} = require("../controllers/paymentsController");

const { requireAuth } = require("../middleware/security");

// POST /api/payments/create-intent -> client starts paying for an accepted application
router.post("/create-intent", requireAuth, createPaymentIntent);

// POST /api/payments/:id/release -> client releases held funds to the provider
router.post("/:id/release", requireAuth, releasePayment);

// POST /api/payments/:id/invoice -> generate a receipt (Stripe invoice) for a paid job
router.post("/:id/invoice", requireAuth, generateInvoice);

// GET /api/payments/listing/:listingId -> payment status for a listing
router.get("/listing/:listingId", requireAuth, getPaymentForListing);

module.exports = router;
