const express = require("express");
const router = express.Router();

const {
  getAllListings,
  getListingById,
  getListingsByUser,
  createListing,
  updateListing,
  deleteListing,
} = require("../controllers/listingsController");

// requireAuth checks the token and sets req.user. Adding it before a controller
// makes that route "logged-in only"; leaving it off keeps the route public.
const { requireAuth } = require("../middleware/security");

// Public reads: anyone can browse listings (matches the API contract).
router.get("/", getAllListings);

router.get("/user/:user_id", getListingsByUser);

router.get("/:id", getListingById);

// Protected writes: must be logged in. requireAuth runs first and blocks
// the request with 401 if the token is missing or invalid.
router.post("/", requireAuth, createListing);

router.put("/:id", requireAuth, updateListing);

router.delete("/:id", requireAuth, deleteListing);

module.exports = router;
