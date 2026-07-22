// applications.js
// API calls for the Applications feature. Every endpoint requires the
// logged-in user's token (saved to localStorage on login).

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({ baseURL: API_URL });

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// POST /api/applications -> apply to a listing
export async function applyToListing({ listingId, phone, message }) {
  const response = await api.post(
    "/api/applications",
    { listing_id: listingId, phone, message },
    { headers: authHeader() }
  );
  return response.data;
}

// GET /api/applications/user -> applications I sent (provider view)
export async function getMyApplications() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  const response = await api.get("/api/applications/user", { headers: authHeader() });
  return response.data;
}

// GET /api/applications/received -> applications on my listings (client view)
export async function getReceivedApplications() {
  const token = localStorage.getItem("token");
  if (!token) return [];
  const response = await api.get("/api/applications/received", { headers: authHeader() });
  return response.data;
}

// GET /api/applications/listing/:listingId/ranked -> AI-ranked applicants (owner only)
// Returns { listingId, listingTitle, applicants, aiRanked }. Each applicant has a
// rank + reason when aiRanked is true; when it's false the list is in natural order.
export async function getRankedApplicationsForListing(listingId) {
  const response = await api.get(
    `/api/applications/listing/${listingId}/ranked`,
    { headers: authHeader() }
  );
  return response.data;
}

// PUT /api/applications/:id -> accept or reject (listing owner only)
export async function updateApplicationStatus(id, status) {
  const response = await api.put(
    `/api/applications/${id}`,
    { status },
    { headers: authHeader() }
  );
  return response.data;
}

// DELETE /api/applications/:id -> withdraw (applicant only)
export async function withdrawApplication(id) {
  const response = await api.delete(`/api/applications/${id}`, { headers: authHeader() });
  return response.data;
}
