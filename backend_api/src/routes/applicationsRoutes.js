// applicationsRoutes.js
// URLs for the Applications feature. The /api/applications prefix is added in
// src/index.js. Every route requires login (applications are tied to a user).

const express = require("express");
const router = express.Router();

const {
  createApplication,
  getMyApplications,
  getReceivedApplications,
  getApplicationsForListing,
  updateApplicationStatus,
  withdrawApplication,
} = require("../controllers/applicationsController");

const { requireAuth } = require("../middleware/security");

// POST /api/applications -> apply to a listing
router.post("/", requireAuth, createApplication);

// GET /api/applications/user     -> applications I sent (provider view)
router.get("/user", requireAuth, getMyApplications);

// GET /api/applications/received -> applications on my listings (client view)
router.get("/received", requireAuth, getReceivedApplications);

// GET /api/applications/listing/:listing_id -> applications for one listing (owner only)
// Placed before "/:id"-style routes so "listing" isn't read as an id.
router.get("/listing/:listing_id", requireAuth, getApplicationsForListing);

// PUT /api/applications/:id -> accept/reject (listing owner only)
router.put("/:id", requireAuth, updateApplicationStatus);

// DELETE /api/applications/:id -> withdraw (applicant only)
router.delete("/:id", requireAuth, withdrawApplication);

module.exports = router;
