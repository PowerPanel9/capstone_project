// listingsController.js
// This file holds the "controller" functions for the Listing feature.
// A controller is where the real work happens: it reads the incoming request,
// talks to the database (through Prisma), and sends a response back.
//
// The route file (listings_routes.js) decides WHICH function runs for each URL.
// This file decides WHAT that function actually does.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Valid listing categories from prisma/schema.prisma (ListingCategory enum).
// Keeping this as plain strings avoids runtime crashes when enum exports differ
// across Prisma/Node setups.
const VALID_CATEGORIES = [
  "CLEANING",
  "TUTORING",
  "PLUMBING",
  "GARDENING",
  "BEAUTY",
  "BABYSITTING",
  "MOVING",
  "HANDYMAN",
  "DELIVERY",
  "OTHER",
];

// Small helper: is this value one of the allowed categories?
function isValidCategory(value) {
  return VALID_CATEGORIES.includes(value);
}

// NOTE ON AUTHENTICATION:
// A few actions below need to know "who is logged in?" (to set the owner of a
// new listing, and to stop people editing/deleting listings they don't own).
// That info will come from `req.user`, which an auth middleware will attach
// once login is built. Until then, those checks are written but will simply
// respond with 401 because `req.user` is undefined.

// GET /api/listings
// Get all listings (home feed + search bar).
//
// This endpoint also supports optional filters passed as query params in the URL,
// for example: /api/listings?search=sink&category=PLUMBING&location=Lincoln
// If no query params are given, it just returns every listing (the plain feed).
async function getAllListings(req, res) {
  try {
    // Query params always arrive as strings (or undefined if not in the URL).
    // custom_category is the free text used when the category is OTHER.
    const { search, category, custom_category, location } = req.query;

    // We build a Prisma "where" object step by step, only adding a filter
    // when that query param was actually provided. Starting empty means
    // "no filters" -> return everything.
    const where = {};

    // Keyword search: match the text anywhere in the title, description, OR
    // the custom category text (so typing "dog walking" finds an OTHER listing
    // whose custom_category is "dog walking").
    // "insensitive" makes it case-insensitive, so "Sink" matches "sink".
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { customCategory: { contains: search, mode: "insensitive" } },
      ];
    }

    // Category filter: must be an exact enum value (e.g. "PLUMBING").
    // If the caller sends a category that isn't valid, tell them clearly (400)
    // instead of letting Prisma throw a confusing 500.
    if (category) {
      if (!isValidCategory(category)) {
        return res.status(400).json({
          error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        });
      }
      where.category = category;

      // Special case: OTHER + custom_category text.
      // Narrow the OTHER bucket down to listings whose free-text category
      // partially matches (e.g. category=OTHER&custom_category=dog -> "dog walking").
      if (category === "OTHER" && custom_category) {
        where.customCategory = { contains: custom_category, mode: "insensitive" };
      }
    }

    // Location filter: partial, case-insensitive match (e.g. "Lincoln").
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    // The home feed only shows OPEN listings. Once a listing is IN_PROGRESS
    // (an applicant was accepted) or COMPLETED, it no longer needs applicants.
    where.status = "OPEN";

    // ----- Pagination (for infinite scroll on the home feed) -----
    // page defaults to 1, limit to 10. `skip` jumps past earlier pages.
    // Example: page 3 with limit 10 -> skip the first 20 listings.
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    // Fetch one page of listings AND the total count (that match the filters),
    // so we can tell the frontend whether more pages exist.
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { user: true }, // attach the creator so the frontend can show poster info
        orderBy: { createdAt: "desc" }, // newest listings first for the feed
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    // hasMore is true when there are still listings beyond this page.
    const hasMore = skip + listings.length < total;

    return res.status(200).json({ listings, page, hasMore, total });
  } catch (error) {
    console.error("getAllListings error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/listings/:id
// Get one listing by its id (the listing detail page).
async function getListingById(req, res) {
  try {
    // URL params arrive as strings, so turn "5" into the number 5 for Prisma.
    const id = Number(req.params.id);

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { user: true }, // attach the creator so the detail view can show poster info
    });

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.status(200).json(listing);
  } catch (error) {
    console.error("getListingById error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/listings/user/:user_id
// Get every listing created by one specific user.
async function getListingsByUser(req, res) {
  try {
    const userId = Number(req.params.user_id);

    // Make sure the user actually exists before looking up their listings.
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const listings = await prisma.listing.findMany({
      where: { userId },
    });

    return res.status(200).json(listings);
  } catch (error) {
    console.error("getListingsByUser error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// POST /api/listings
// Create a new listing.
async function createListing(req, res) {
  try {
    // Only logged-in users can create a listing.
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Pull the fields the frontend sent in the request body.
    const { title, category, custom_category, image_url, description, price, skills_required, location } =
      req.body;

    // Validate the required fields (contract: 400 if missing required fields).
    // category is required, so it's included in this check.
    if (!title || !category || !description || price === undefined || !location) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // category must be one of the allowed enum values (400 if not).
    if (!isValidCategory(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    // If the user picked OTHER, they must type their own category (400 if missing).
    // For any fixed category we ignore custom_category and store null, so the
    // data stays clean (no stray text attached to PLUMBING, etc.).
    if (category === "OTHER" && !custom_category) {
      return res.status(400).json({
        error: "custom_category is required when category is OTHER",
      });
    }
    const customCategory = category === "OTHER" ? custom_category : null;

    const newListing = await prisma.listing.create({
      data: {
        title,
        category, // must match a value in the ListingCategory enum
        customCategory, // free text when OTHER, otherwise null
        imageUrl: image_url, // optional; ok if undefined
        description,
        price,
        skillsRequired: skills_required || [],
        location,
        userId: req.user.userId, // the owner is whoever is logged in (from the token)
      },
    });

    // 201 = created successfully.
    return res.status(201).json(newListing);
  } catch (error) {
    console.error("createListing error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// PUT /api/listings/:id
// Update a listing. Only the owner may update it.
async function updateListing(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);

    // First find the listing so we can (a) confirm it exists and (b) check ownership.
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Contract: 401 if not owner.
    if (listing.userId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const { title, category, custom_category, description, price, skills_required, location, image_url, status } =
      req.body;

    // category is optional on update, but if it's provided it must be valid (400).
    if (category !== undefined && !isValidCategory(category)) {
      return res.status(400).json({
        error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
      });
    }

    // Work out what the category will be AFTER this update: the new one if the
    // caller sent it, otherwise the listing's existing category.
    const effectiveCategory = category !== undefined ? category : listing.category;

    // Decide what custom_category should become.
    // - If the (new or existing) category is OTHER, we need custom text. Use the
    //   value sent this time, or fall back to whatever the listing already had.
    // - If the category is a fixed one, custom_category is always null.
    let customCategory;
    if (effectiveCategory === "OTHER") {
      const nextCustom =
        custom_category !== undefined ? custom_category : listing.customCategory;
      if (!nextCustom) {
        return res.status(400).json({
          error: "custom_category is required when category is OTHER",
        });
      }
      customCategory = nextCustom;
    } else {
      customCategory = null;
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        title,
        category,
        customCategory,
        description,
        price,
        skillsRequired: skills_required,
        location,
        imageUrl: image_url,
        status,
      },
    });

    return res.status(200).json(updatedListing);
  } catch (error) {
    console.error("updateListing error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// DELETE /api/listings/:id
// Delete a listing. Only the owner may delete it.
async function deleteListing(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const id = Number(req.params.id);

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    if (listing.userId !== req.user.userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    await prisma.listing.delete({ where: { id } });

    return res.status(200).json({ message: "Listing deleted successfully" });
  } catch (error) {
    console.error("deleteListing error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  getAllListings,
  getListingById,
  getListingsByUser,
  createListing,
  updateListing,
  deleteListing,
};
