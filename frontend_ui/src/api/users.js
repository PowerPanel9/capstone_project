// users.js
// API calls for fetching user profiles (public, read-only view).

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// GET /api/users/:id  -> a user's public profile
export async function getUserById(id) {
  const response = await api.get(`/api/users/${id}`);
  return response.data;
}
