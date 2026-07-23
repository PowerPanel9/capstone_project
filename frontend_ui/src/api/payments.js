// payments.js
// API calls for the marketplace payment flow. All require login.

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const api = axios.create({ baseURL: API_URL });

function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// POST /api/payments/create-intent -> { clientSecret, paymentId, amount }
// Starts a held payment for an accepted application.
export async function createPaymentIntent(applicationId) {
  const response = await api.post(
    "/api/payments/create-intent",
    { application_id: applicationId },
    { headers: authHeader() }
  );
  return response.data;
}

// POST /api/payments/:id/release -> releases held funds to the provider.
export async function releasePayment(paymentId) {
  const response = await api.post(`/api/payments/${paymentId}/release`, {}, { headers: authHeader() });
  return response.data;
}

// GET /api/payments/listing/:listingId -> the payment for a listing (or null).
export async function getPaymentForListing(listingId) {
  const response = await api.get(`/api/payments/listing/${listingId}`, { headers: authHeader() });
  return response.data;
}

// POST /api/payments/:id/invoice -> generate a receipt; returns { invoiceUrl }.
export async function generatePaymentInvoice(paymentId) {
  const response = await api.post(`/api/payments/${paymentId}/invoice`, {}, { headers: authHeader() });
  return response.data;
}
