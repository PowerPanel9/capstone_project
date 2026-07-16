// reviews.js
// API calls for the Reviews feature. Reads are public; creating/deleting a
// review requires the logged-in user's token (saved to localStorage on login).

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// Build the Authorization header from the saved token (empty if logged out).
function authHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// GET /api/reviews/user/:userId
// All reviews written ABOUT a user (their profile reviews). Each review
// includes its `reviewer` so the UI can show who left it.
export async function getReviewsForUser(userId) {
  const response = await api.get(`/api/reviews/user/${userId}`);
  return response.data;
}

// POST /api/reviews
// Leave a review about another user. `revieweeId` is who the review is for;
// the reviewer is taken from the token on the backend.
export async function createReview({ stars, title, description, imageUrl, revieweeId }) {
  const response = await api.post(
    "/api/reviews",
    {
      stars,
      title,
      description,
      image_url: imageUrl || null,
      reviewee_id: revieweeId,
    },
    { headers: authHeader() }
  );
  return response.data;
}

// DELETE /api/reviews/:id  -> remove one of your own reviews
export async function deleteReview(reviewId) {
  const response = await api.delete(`/api/reviews/${reviewId}`, {
    headers: authHeader(),
  });
  return response.data;
}
