import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// One shared socket connection for the whole app. `connectSocket` is called
// once after login (and on app load if already logged in); `disconnectSocket`
// is called on logout so we stop listening for someone else's messages.
let socket = null;

export function connectSocket() {
  const token = localStorage.getItem("token");
  if (!token || socket) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
