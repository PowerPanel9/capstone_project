// agent.js
// API call for the AI agent chat feature, kept in one place like listings.js.
// The AIAgentModal component imports this instead of calling axios directly.

import axios from "axios";

// Same backend base URL the rest of the app uses (from the .env file).
const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

// POST /api/agent/chat
// Sends the user's message to the backend agent and returns Claude's reply text.
// The backend responds with { reply: "..." }, so we hand back just that string.
// Requires authentication - automatically includes the JWT token from localStorage.
export async function sendAgentMessage(message) {
  const token = localStorage.getItem('token');

  const response = await api.post(
    "/api/agent/chat",
    { message },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data.reply;
}
