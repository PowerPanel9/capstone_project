// users.js
// All the API calls for the User feature live here, in one place.
// Components import these functions instead of talking to axios directly,
// so if the API changes we only edit this file.

import axios from "axios";

// The backend base URL comes from the .env file (VITE_API_URL).
// Example: http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL || "https://side-hustle-xw5e.onrender.com";

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
