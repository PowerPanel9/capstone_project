// bookmarksController.js
// Controller functions for the Bookmark feature.
// A bookmark lets a user save a listing so they can find and apply to it later.
// Every bookmark belongs to the logged-in user, so all of these actions require auth.
//
// The user id comes from req.user.userId, which the requireAuth middleware sets
// after reading the login token (same pattern as the listings feature).

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// POST /api/bookmarks
// Save a listing to the current user's bookmarks.
async function createBookmark(req, res) {
  try {
    // requireAuth guarantees req.user exists, but we double-check to be safe.
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.userId;
    const { listing_id } = req.body;

    // Must tell us which listing to bookmark.
    if (listing_id === undefined) {
      return res.status(400).json({ error: "listing_id is required" });
    }

    // Make sure the listing actually exists before bookmarking it (404 if not).
    const listing = await prisma.listing.findUnique({
      where: { id: listing_id },
    });
    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    // Has this user already bookmarked this listing?
    // The schema has @@unique([userId, listingId]), so a duplicate would throw,
    // but checking first lets us return a clean 400 (contract: "already bookmarked").
    const existing = await prisma.bookmark.findUnique({
      where: { userId_listingId: { userId, listingId: listing_id } },
    });
    if (existing) {
      return res.status(400).json({ error: "Listing already bookmarked" });
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId, // the owner is whoever is logged in
        listingId: listing_id,
      },
    });

    // 201 = created successfully.
    return res.status(201).json(bookmark);
  } catch (error) {
    console.error("createBookmark error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// GET /api/bookmarks
// Get all bookmarks that belong to the current user.
// We include the full listing so the frontend can show the saved listings
// (title, price, etc.) without a second request.
async function getMyBookmarks(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userId = req.user.userId;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      // attach each bookmarked listing AND that listing's owner, so the
      // frontend can render the same cards as the main feed (poster name, etc.)
      include: { listing: { include: { user: true } } },
      // sort by when the bookmark was created (not the listing), newest first,
      // so the most recently bookmarked listing appears at the top.
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(bookmarks);
  } catch (error) {
    console.error("getMyBookmarks error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

// DELETE /api/bookmarks/:id
// Remove a bookmark. A user can only remove their own bookmarks.
async function deleteBookmark(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // URL params arrive as strings, so convert "5" to the number 5.
    const id = Number(req.params.id);
    const userId = req.user.userId;

    // Find the bookmark first so we can confirm it exists and who owns it.
    const bookmark = await prisma.bookmark.findUnique({ where: { id } });
    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    // Contract: 401 if not owner.
    if (bookmark.userId !== userId) {
      return res.status(401).json({ error: "Not authorized" });
    }

    await prisma.bookmark.delete({ where: { id } });

    return res.status(200).json({ message: "Bookmark removed successfully" });
  } catch (error) {
    console.error("deleteBookmark error:", error.message);
    return res.status(500).json({ error: "Something went wrong" });
  }
}

module.exports = {
  createBookmark,
  getMyBookmarks,
  deleteBookmark,
};
