// prices.js
// API call for the price-suggestion feature. Given a category and location,
// the backend looks at similar existing listings and suggests a fair price.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// POST /api/prices/recommendations
// Returns { recommendedPrice, priceRange: { min, max }, reasoning, dataPoints }.
export async function getPriceRecommendations({ category, location, description }) {
  const response = await api.post("/api/prices/recommendations", {
    category,
    location,
    description,
  });
  return response.data;
}
