// users.mjs
// Tool handlers for user/provider search and profile features.
//
// These tools help the AI agent find providers, view their profiles,
// and understand who's available for different jobs.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper to format results for MCP
const jsonResult = (data) => {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
  };
};

// TOOL: search_users
// Find users/providers by skills, location, or other criteria.
// Similar to search_listings but for finding people instead of jobs.
export const searchUsers = async ({ skills, location, search }) => {
  const where = {};

  // If skills are provided, find users whose skills array overlaps with requested skills.
  // For example, if searching for ["plumbing", "handyman"], find users with either skill.
  if (skills && skills.length > 0) {
    where.skills = {
      hasSome: skills, // Prisma: check if array contains any of these values
    };
  }

  // Location search: partial, case-insensitive match
  if (location) {
    where.location = {
      contains: location,
      mode: "insensitive",
    };
  }

  // Keyword search: match in firstName, lastName, or bio
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { bio: { contains: search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
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
      // Include review stats to help with ranking
      reviewsReceived: {
        select: {
          stars: true,
        },
      },
    },
    take: 20, // Limit results for performance
  });

  // Calculate average rating for each user
  const usersWithRatings = users.map((user) => {
    const reviews = user.reviewsReceived;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length
        : null;

    return {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      imageUrl: user.imageUrl,
      bio: user.bio,
      skills: user.skills,
      location: user.location,
      resumeUrl: user.resumeUrl,
      certificationUrl: user.certificationUrl,
      avgRating: avgRating ? avgRating.toFixed(1) : "No reviews yet",
      reviewCount: reviews.length,
    };
  });

  return jsonResult({
    users: usersWithRatings,
    total: usersWithRatings.length,
  });
};

// TOOL: get_user_profile
// Get detailed information about a specific user/provider.
// Includes their bio, skills, reviews, and past work.
export const getUserProfile = async ({ userId }) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      // Include listings this user created (shows their work history as a customer)
      listings: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5, // Last 5 listings
      },
      // Include reviews they received (their reputation as a provider)
      reviewsReceived: {
        select: {
          stars: true,
          title: true,
          description: true,
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { id: "desc" },
        take: 5, // Last 5 reviews
      },
      // Include reviews they wrote (shows they're active in the community)
      reviewsWritten: {
        select: {
          stars: true,
        },
      },
    },
  });

  if (!user) {
    return jsonResult({ error: "User not found" });
  }

  // Calculate stats
  const receivedReviews = user.reviewsReceived;
  const avgRating =
    receivedReviews.length > 0
      ? receivedReviews.reduce((sum, r) => sum + r.stars, 0) / receivedReviews.length
      : null;

  const profile = {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    imageUrl: user.imageUrl,
    bio: user.bio,
    skills: user.skills,
    location: user.location,
    resumeUrl: user.resumeUrl,
    certificationUrl: user.certificationUrl,
    joinDate: user.createdAt,
    stats: {
      avgRating: avgRating ? avgRating.toFixed(1) : null,
      totalReviewsReceived: receivedReviews.length,
      totalReviewsWritten: user.reviewsWritten.length,
      totalListingsCreated: user.listings.length,
    },
    recentReviews: receivedReviews.map((r) => ({
      stars: r.stars,
      title: r.title,
      description: r.description,
      from: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
    })),
    recentListings: user.listings,
  };

  return jsonResult(profile);
};
