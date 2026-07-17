// priceIntelligenceService.js
// This service analyzes existing listings to suggest fair prices for new listings.
// It looks at similar listings (same category, nearby location) and calculates
// average, median, min, and max prices to help users price competitively.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Get price recommendations based on similar listings
 * @param {Object} params - { category, location, description (optional) }
 * @returns {Object} - { recommendedPrice, priceRange, similarListings, reasoning }
 */
async function getPriceRecommendations(params) {
  const { category, location } = params;

  // Step 1: Build the search criteria
  // We want listings that are:
  // - Same category
  // - Similar location (contains the location text)
  // - OPEN status (active market prices, not old/completed)
  const where = {
    category: category,
    status: "OPEN",
  };

  // If location provided, narrow to nearby listings
  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  // Step 2: Query the database for similar listings
  const similarListings = await prisma.listing.findMany({
    where,
    select: {
      id: true,
      title: true,
      price: true,
      location: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 20, // Limit to recent 20 listings for performance
  });

  // Step 3: If no similar listings, return a default message
  if (similarListings.length === 0) {
    return {
      recommendedPrice: null,
      priceRange: { min: null, max: null },
      similarListings: [],
      reasoning:
        "No similar listings found. Try checking nearby areas or similar categories.",
      dataPoints: 0,
    };
  }

  // Step 4: Calculate price statistics
  const prices = similarListings.map((listing) => Number(listing.price));

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

  // Median calculation (sort prices, take middle value)
  const sortedPrices = [...prices].sort((a, b) => a - b);
  const medianPrice =
    sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] +
          sortedPrices[sortedPrices.length / 2]) /
        2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];

  // Step 5: Decide on the recommended price
  // We use median (not average) because it's less affected by outliers.
  // Round to nearest dollar for simplicity.
  const recommendedPrice = Math.round(medianPrice);

  // Step 6: Build reasoning text
  const locationText = location ? ` in ${location}` : "";
  const reasoning = `Based on ${similarListings.length} similar ${category} listings${locationText}. Prices range from $${minPrice.toFixed(0)} to $${maxPrice.toFixed(0)}.`;

  // Step 7: Return the results
  return {
    recommendedPrice,
    priceRange: { min: minPrice, max: maxPrice },
    similarListings: similarListings.slice(0, 5), // Return top 5 for display
    reasoning,
    dataPoints: similarListings.length,
    avgPrice: Math.round(avgPrice),
  };
}

module.exports = {
  getPriceRecommendations,
};
