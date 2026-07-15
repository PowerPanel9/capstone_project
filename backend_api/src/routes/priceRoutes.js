// priceRoutes.js
// API routes for price intelligence features.
// These routes help users price their listings competitively by analyzing
// the market (existing similar listings).

const express = require("express");
const router = express.Router();
const {
  getPriceRecommendations,
} = require("../services/priceIntelligenceService");

// POST /api/prices/recommendations
// Get price suggestions based on category and location.
// Body: { category, location, description (optional) }
router.post("/recommendations", async (req, res) => {
  try {
    const { category, location, description } = req.body;

    // Validate required fields
    if (!category) {
      return res.status(400).json({ error: "Category is required" });
    }

    // Call the service to get recommendations
    const recommendations = await getPriceRecommendations({
      category,
      location,
      description,
    });

    return res.status(200).json(recommendations);
  } catch (error) {
    console.error("getPriceRecommendations error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
