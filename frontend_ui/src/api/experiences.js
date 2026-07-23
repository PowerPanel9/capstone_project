// experiences.js
// API calls for the Experiences feature. Reads are public; creating an
// experience requires the logged-in user's token (saved to localStorage on
// login). Components import these functions instead of talking to axios
// directly, so if the API changes we only edit this file.

import axios from "axios";

// Fall back to localhost if VITE_API_URL isn't set (e.g. the dev server was
// started before .env existed) so requests still reach the backend.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

// Build the Authorization header from the saved token (empty if logged out).
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/experiences
// Every experience, in a random order, for the client-mode home feed. Each
// experience includes its `user` (poster) so the UI can show who posted it.
// Pass { category } to show only experiences in that category.
export async function getExperiences({ category } = {}) {
  const params = {};
  if (category) params.category = category;
  const response = await api.get("/api/experiences", { params });
  return Array.isArray(response.data) ? response.data : [];
}

// GET /api/experiences/:id
// A single experience, including its `user` (poster), for the detail page.
export async function getExperienceById(id) {
  const response = await api.get(`/api/experiences/${id}`);
  return response.data;
}

// GET /api/experiences/user/:userId
// The experiences a single user posted, newest first (used on the profile).
export async function getExperiencesByUser(userId) {
  const response = await api.get(`/api/experiences/user/${userId}`);
  return Array.isArray(response.data) ? response.data : [];
}

// POST /api/experiences
// Create a new experience for the logged-in user. jobTitle and description are
// required; category defaults to OTHER; customCategory is only used when the
// category is OTHER; images is an optional array of base64 data URLs. The
// poster is taken from the token on the backend.
export async function createExperience({ jobTitle, category, customCategory, description, images }) {
  const response = await api.post(
    "/api/experiences",
    {
      jobTitle,
      category,
      customCategory: customCategory || null,
      description,
      images: Array.isArray(images) ? images : [],
    },
    { headers: authHeader() }
  );
  return response.data;
}
