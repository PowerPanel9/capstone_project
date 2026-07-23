// connect.js
// API calls for Stripe Connect provider onboarding. All require login.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const api = axios.create({ baseURL: API_URL });

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// POST /api/connect/onboard -> returns { url } to Stripe's hosted onboarding.
export async function startOnboarding() {
  const response = await api.post("/api/connect/onboard", {}, { headers: authHeader() });
  return response.data;
}

// GET /api/connect/status -> { hasAccount, onboarded, payoutsEnabled, chargesEnabled }
export async function getOnboardingStatus() {
  const response = await api.get("/api/connect/status", { headers: authHeader() });
  return response.data;
}
