// listings.js
// All the API calls for the Listing feature live here, in one place.
// Components import these functions instead of talking to axios directly,
// so if the API changes we only edit this file.

import axios from "axios";

// The backend base URL comes from the .env file (VITE_API_URL).
// Example: http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// A shared axios instance pointed at our backend.
const api = axios.create({
  baseURL: API_URL,
});

// GET /api/listings  (optionally filtered by search/category/location)
// Returns the listings exactly as the backend sends them. Components read the
// real backend fields directly (price, skillsRequired, imageUrl, user, ...).
export async function getListings({ search, category, location } = {}) {
  const params = {};
  if (search) params.search = search;
  if (category) params.category = category;
  if (location) params.location = location;

  const response = await api.get("/api/listings", { params });
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Defensive fallback: keep UI stable even if backend returns an error object.
  return [];
}

// GET /api/listings/:id  -> one listing, raw from the backend
export async function getListingById(id) {
  const response = await api.get(`/api/listings/${id}`);
  return response.data;
}
