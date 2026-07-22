// recommendations.js
// API call for the personalized home feed. The backend looks at the logged-in
// provider's skills and history and returns open listings ranked best-fit first,
// each with a short reason.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// GET /api/recommendations
// This route is protected, so we send the logged-in user's token (saved to
// localStorage by the AuthModal).
// Returns { listings, personalized, message? }. Each recommended listing may
// include a `reason` string explaining why it was suggested.
export async function getRecommendedListings() {
  const token = localStorage.getItem("token");
  const response = await api.get("/api/recommendations", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return response.data;
}
