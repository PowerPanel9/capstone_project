// recommendationRoutes.js
// API route for the personalized home feed.
// A logged-in provider gets open listings re-ordered by the AI so the jobs
// that best fit their skills and history appear first.

const express = require("express");
const router = express.Router();

const {
  getRecommendedListings,
} = require("../services/recommendationService");

// requireAuth sets req.user from the token. We need it because the feed is
// personalized to the logged-in user.
const { requireAuth } = require("../middleware/security");

// GET /api/recommendations
// Returns { listings, personalized, message? }. `listings` are in recommended
// order; each recommended listing may include a `reason` string.
router.get("/", requireAuth, async (req, res) => {
  try {
    // The JWT payload stores the user id as `userId` (see authController).
    const userId = req.user.userId;

    const result = await getRecommendedListings(userId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("getRecommendedListings error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
