// bookmarksRoutes.js
// URLs for the Bookmark feature. The /api/bookmarks prefix is added in index.js,
// so the paths here are relative to that.
//
// Every bookmark route is protected: a user must be logged in to save, view,
// or remove bookmarks (they are private to each user). requireAuth runs first
// and blocks the request with 401 if the token is missing or invalid.

const express = require("express");
const router = express.Router();

const {
  createBookmark,
  getMyBookmarks,
  deleteBookmark,
} = require("../controllers/bookmarksController");

const { requireAuth } = require("../middleware/security");

// POST /api/bookmarks  -> save a listing to the current user's bookmarks
router.post("/", requireAuth, createBookmark);

// GET /api/bookmarks   -> get the current user's bookmarks
router.get("/", requireAuth, getMyBookmarks);

// DELETE /api/bookmarks/:id -> remove one of the current user's bookmarks
router.delete("/:id", requireAuth, deleteBookmark);

module.exports = router;
