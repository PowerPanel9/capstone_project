// reviewsRoutes.js
// URLs for the Reviews feature. The /api/reviews prefix is added in index.js,
// so the paths here are relative to that.
//
// Reads are public (anyone can view a user's reviews on their profile).
// Writes (create/delete) require login: requireAuth runs first and blocks the
// request with 401 if the token is missing or invalid.

const express = require("express");
const router = express.Router();

const {
  createReview,
  getReviewById,
  getReviewsForUser,
  deleteReview,
} = require("../controllers/reviewsController");

const { requireAuth } = require("../middleware/security");

// POST /api/reviews  -> create a review about another user (must be logged in)
router.post("/", requireAuth, createReview);

// GET /api/reviews/user/:user_id  -> all reviews for one user (profile page)
// NOTE: placed BEFORE "/:id" so "/user/5" isn't mistaken for a review whose id
// is the word "user". Express matches routes top-to-bottom.
router.get("/user/:user_id", getReviewsForUser);

// GET /api/reviews/:id  -> one review by id
router.get("/:id", getReviewById);

// DELETE /api/reviews/:id  -> delete your own review (must be logged in)
router.delete("/:id", requireAuth, deleteReview);

module.exports = router;
