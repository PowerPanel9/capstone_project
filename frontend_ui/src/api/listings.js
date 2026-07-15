// listings.js
// All the API calls for the Listing feature live here, in one place.
// Components import these functions instead of talking to axios directly,
// so if the API changes we only edit this file.

import axios from "axios";

// The backend base URL comes from the .env file (VITE_API_URL).
// Example: http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL;

// A shared axios instance pointed at our backend.
const api = axios.create({
  baseURL: API_URL,
});

// GET /api/listings  (optionally filtered by search/category/location)
// Returns the listings exactly as the backend sends them. Components read the
// real backend fields directly (price, skillsRequired, imageUrl, user, ...).
// Returns { listings, page, hasMore, total }. `page`/`limit` drive pagination
// for the home feed's infinite scroll.
export async function getListings({ search, category, location, page, limit } = {}) {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (location) params.location = location;
  if (page) params.page = page;
  if (limit) params.limit = limit;

  const response = await api.get("/api/listings", { params });
  return response.data;
}

// GET /api/listings/:id  -> one listing, raw from the backend
export async function getListingById(id) {
  const response = await api.get(`/api/listings/${id}`);
  return response.data;
}

// POST /api/listings  -> create a new listing.
// This route is protected, so we send the logged-in user's token (saved to
// localStorage by the AuthModal). `listing` must already use the backend's
// snake_case field names (title, category, custom_category, price,
// skills_required, location, image_url).
export async function createListing(listing) {
  const token = localStorage.getItem("token");
  const response = await api.post("/api/listings", listing, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}
