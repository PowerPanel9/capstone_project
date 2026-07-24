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

// Build the Authorization header from the saved login token.
// Updating a profile is a protected action, so the backend needs this.
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// PUT /api/users/:id  -> update the logged-in user's own profile.
// `fields` is an object with just the fields we want to change, e.g.
// { role: "PROVIDER" } or { location, bio }. The backend only updates the
// fields it receives, so each onboarding step can save a little at a time.
export async function updateUser(id, fields) {
  const response = await api.put(`/api/users/${id}`, fields, {
    headers: authHeader(),
  });
  return response.data;
}

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
// client-mode home feed. Pass excludeId to leave the logged-in user out.
// Only returns safe public fields (id, name, profilePicture, skills).
export async function getProviders(excludeId) {
  const params = {};
  if (excludeId) params.excludeId = excludeId;
  const response = await api.get("/api/users/providers", { params });
  return Array.isArray(response.data) ? response.data : [];
}
