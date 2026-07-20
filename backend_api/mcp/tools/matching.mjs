// matching.mjs
// Tool handlers for intelligent matching between providers and listings.
//
// These tools use algorithms to find the best matches based on skills,
// location, reviews, and other factors.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to format results for MCP
const jsonResult = (data) => {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
};

// Calculate how well a provider's skills match the required skills
const calculateSkillMatch = (providerSkills, requiredSkills) => {
  if (!requiredSkills || requiredSkills.length === 0) {
    return 50; // Neutral score if no skills required
  }

  const providerSkillsLower = providerSkills.map((s) => s.toLowerCase());
  const requiredSkillsLower = requiredSkills.map((s) => s.toLowerCase());

  const matchedSkills = requiredSkillsLower.filter((skill) =>
    providerSkillsLower.includes(skill)
  );

  // Percentage of required skills that the provider has
  return (matchedSkills.length / requiredSkillsLower.length) * 100;
};

// Simple distance score based on location string matching
// In a real app, you'd use geolocation coordinates and calculate actual distance
const calculateLocationMatch = (providerLocation, listingLocation) => {
  if (!providerLocation || !listingLocation) {
    return 50; // Neutral if location data missing
  }

  const providerLoc = providerLocation.toLowerCase();
  const listingLoc = listingLocation.toLowerCase();

  // Exact match
  if (providerLoc === listingLoc) {
    return 100;
  }

  // Partial match (e.g., both contain "Manhattan")
  if (providerLoc.includes(listingLoc) || listingLoc.includes(providerLoc)) {
    return 80;
  }

  // Check if they share any words (e.g., "New York" and "York City")
  const providerWords = providerLoc.split(/\s+/);
  const listingWords = listingLoc.split(/\s+/);
  const commonWords = providerWords.filter((word) => listingWords.includes(word));

  if (commonWords.length > 0) {
    return 60;
  }

  // No match
  return 20;
};

// TOOL: match_providers_to_listing
// Find the best providers for a specific job listing.
// Uses a scoring algorithm based on skills, location, reviews, and availability.
export const matchProvidersToListing = async ({ listingId }) => {
  // Get the listing details
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  if (!listing) {
    return jsonResult({ error: "Listing not found" });
  }

  // Find all users who might be good matches
  // We'll cast a wide net and then rank them
  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      imageUrl: true,
      bio: true,
      skills: true,
      location: true,
      resumeUrl: true,
      certificationUrl: true,
      reviewsReceived: {
        select: {
          stars: true,
        },
      },
    },
  });

  // Score each user based on how well they match the listing
  const scoredUsers = users.map((user) => {
    const skillScore = calculateSkillMatch(user.skills, listing.skillsRequired);
    const locationScore = calculateLocationMatch(user.location, listing.location);

    // Calculate average rating
    const reviews = user.reviewsReceived;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
        : 3; // Default to 3 if no reviews

    // Rating score: normalize 1-5 stars to 0-100
    const ratingScore = ((avgRating - 1) / 4) * 100;

    // Weighted overall score
    const overallScore =
      skillScore * 0.5 + // Skills are most important (50%)
      locationScore * 0.3 + // Location matters (30%)
      ratingScore * 0.2; // Rating is a factor (20%)

    return {
      userId: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      bio: user.bio,
      skills: user.skills,
      location: user.location,
      resumeUrl: user.resumeUrl,
      certificationUrl: user.certificationUrl,
      avgRating: reviews.length > 0 ? avgRating.toFixed(1) : "No reviews",
      reviewCount: reviews.length,
      matchScore: Math.round(overallScore),
      breakdown: {
        skillMatch: Math.round(skillScore),
        locationMatch: Math.round(locationScore),
        ratingScore: Math.round(ratingScore),
      },
    };
  });

  // Sort by match score (highest first) and take top 10
  const topMatches = scoredUsers
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return jsonResult({
    listingId: listing.id,
    listingTitle: listing.title,
    listingCategory: listing.category,
    listingLocation: listing.location,
    requiredSkills: listing.skillsRequired,
    matches: topMatches,
    totalCandidates: users.length,
  });
};

// TOOL: match_listings_to_provider
// Find the best job listings for a specific provider.
// Flips the matching logic - finds jobs that suit a provider's skills.
export const matchListingsToProvider = async ({ userId }) => {
  // Get the provider's profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      skills: true,
      location: true,
    },
  });

  if (!user) {
    return jsonResult({ error: "User not found" });
  }

  // Find all open listings
  const listings = await prisma.listing.findMany({
    where: {
      status: "OPEN", // Only show open jobs
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Score each listing based on how well it matches the provider
  const scoredListings = listings.map((listing) => {
    const skillScore = calculateSkillMatch(user.skills, listing.skillsRequired);
    const locationScore = calculateLocationMatch(user.location, listing.location);

    // Weighted overall score
    const overallScore =
      skillScore * 0.6 + // Provider's skills matching required skills (60%)
      locationScore * 0.4; // Location proximity (40%)

    return {
      listingId: listing.id,
      title: listing.title,
      category: listing.category,
      description: listing.description,
      price: listing.price,
      location: listing.location,
      skillsRequired: listing.skillsRequired,
      status: listing.status,
      postedBy: `${listing.user.firstName} ${listing.user.lastName}`,
      createdAt: listing.createdAt,
      matchScore: Math.round(overallScore),
      breakdown: {
        skillMatch: Math.round(skillScore),
        locationMatch: Math.round(locationScore),
      },
    };
  });

  // Sort by match score (highest first) and take top 10
  const topMatches = scoredListings
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

  return jsonResult({
    userId: user.id,
    providerName: `${user.firstName} ${user.lastName}`,
    providerSkills: user.skills,
    providerLocation: user.location,
    matches: topMatches,
    totalListings: listings.length,
  });
};
