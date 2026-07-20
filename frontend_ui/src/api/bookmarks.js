// bookmarks.js
// All the API calls for the Bookmark feature live here, in one place.
//
// Every bookmark endpoint on the backend is protected (requireAuth), so each
// request must send the logged-in user's token. That token is saved to
// localStorage by the AuthModal when a user logs in or registers.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Build the Authorization header from the saved token.
// Returns an empty object if there's no token (user not logged in), which lets
// callers decide how to handle the logged-out case instead of crashing.
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/bookmarks
// Returns the current user's bookmarks. Each bookmark includes its listing
// (and the listing's owner) so the UI can render listing cards directly.
// If the user isn't logged in, we return an empty list rather than erroring.
export async function getBookmarks() {
  const token = localStorage.getItem("token");
  if (!token) return [];

  const response = await api.get("/api/bookmarks", { headers: authHeader() });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.bookmarks)) return data.bookmarks;
  return [];
}

// POST /api/bookmarks  -> save a listing. Body: { listing_id }
export async function addBookmark(listingId) {
  const response = await api.post(
    "/api/bookmarks",
    { listing_id: listingId },
    { headers: authHeader() }
  );
  return response.data;
}

// DELETE /api/bookmarks/:id  -> remove a bookmark by its BOOKMARK id
// (not the listing id — the two are different).
export async function removeBookmark(bookmarkId) {
  const response = await api.delete(`/api/bookmarks/${bookmarkId}`, {
    headers: authHeader(),
  });
  return response.data;
}
