import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
});

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function getInbox() {
  const response = await api.get("/api/messages/inbox", {
    headers: authHeaders(),
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getConversation(otherUserId) {
  const response = await api.get(`/api/messages/conversations/${otherUserId}`, {
    headers: authHeaders(),
  });
  const data = response.data || {};
  return {
    otherUser: data.otherUser || null,
    messages: Array.isArray(data.messages) ? data.messages : [],
  };
}

export async function sendMessage({ recipientId, content }) {
  const response = await api.post(
    "/api/messages",
    { recipientId, content },
    { headers: authHeaders() }
  );
  return response.data;
}

export async function getUsers() {
  const response = await api.get("/users");
  return Array.isArray(response.data) ? response.data : [];
}
