// users.js
// All the API calls for the User feature live here, in one place.
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

// GET /api/users/name/:name
// Searches users (providers) by first or last name and returns the matching
// list. The backend responds with an array, so we always hand back an array
// to keep the calling component simple.
export async function getUsersByName(name) {
  const response = await api.get(`/api/users/name/${encodeURIComponent(name)}`);
  const data = response.data;
  return Array.isArray(data) ? data : [];
}

// GET /api/users/:id  -> a user's public profile
export async function getUserById(id) {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
}

// GET /api/users/providers  -> a randomized list of providers for the
// client-mode home feed. Pass excludeId to leave the logged-in user out, and
// category to only get providers who offer that service (e.g. "CLEANING").
// Only returns safe public fields (id, name, profilePicture, skills).
export async function getProviders({ excludeId, category } = {}) {
  const params = {};
  if (excludeId) params.excludeId = excludeId;
  if (category) params.category = category;
  const response = await api.get("/api/users/providers", { params });
  return Array.isArray(response.data) ? response.data : [];
}
