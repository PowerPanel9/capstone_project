// reviewsController.js
// Controller functions for the Reviews feature.
// A review is one user (the "reviewer") rating another user (the "reviewee")
// with a star rating (1-5), a title, a description, and an optional image.
//
// The reviewer is always the logged-in user (from req.user.userId, set by the
// requireAuth middleware). The reviewee is passed in the request body.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/reviews
// Create a review about another user.
async function createReview(req, res) {
  try {
    // Only logged-in users can leave a review.
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const reviewerId = req.user.userId; // who is writing the review
    const { stars, title, description, image_url, reviewee_id } = req.body;

    // Validate required fields (contract: 400 if missing required fields).
    if (stars === undefined || !title || !description || reviewee_id === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Stars must be a whole number from 1 to 5.
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ error: "Stars must be a whole number between 1 and 5" });
    }

    // A user cannot review themselves.
    if (reviewee_id === reviewerId) {
      return res.status(400).json({ error: "You cannot review yourself" });
    }

    // Make sure the person being reviewed actually exists (404 if not).
    const reviewee = await prisma.user.findUnique({ where: { id: reviewee_id } });
    if (!reviewee) {
      return res.status(404).json({ error: "User being reviewed not found" });
    }

    const newReview = await prisma.review.create({
      data: {
        stars,
        title,
        description,
        imageUrl: image_url, // optional; ok if undefined
        revieweeId: reviewee_id,
        reviewerId,
      },
    });

    // 201 = created successfully.
    return res.status(201).json(newReview);
  } catch (error) {
    console.error("createReview error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/reviews/:id
// Get one review by its id. Public — anyone can read a review.
async function getReviewById(req, res) {
  try {
    const id = Number(req.params.id);

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    return res.status(200).json(review);
  } catch (error) {
    console.error("getReviewById error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/reviews/user/:user_id
// Get all reviews written ABOUT a specific user (their profile reviews).
// Public — anyone viewing a profile can see its reviews.
async function getReviewsForUser(req, res) {
  try {
    const userId = Number(req.params.user_id);

    // Make sure the user exists before looking up their reviews (404 if not).
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const reviews = await prisma.review.findMany({
      where: { revieweeId: userId },
      // include the reviewer so the profile can show who left each review
      include: { reviewer: true },
      orderBy: { createdAt: "desc" }, // newest reviews first
    });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error("getReviewsForUser error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// DELETE /api/reviews/:id
// Delete a review. Only the person who wrote it may delete it.
async function deleteReview(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);
    const userId = req.user.userId;

    // Find the review first so we can confirm it exists and who wrote it.
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Only the original reviewer can delete their review.
    if (review.reviewerId !== userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    await prisma.review.delete({ where: { id } });

    return res.status(200).json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("deleteReview error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  createReview,
  getReviewById,
  getReviewsForUser,
  deleteReview,
};
