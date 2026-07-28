require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");
const messageRoutes = require("./routes/messageRoutes");
const listingsRoutes = require("./routes/listingsRoutes");
const bookmarksRoutes = require("./routes/bookmarksRoutes");
const experienceRoutes = require("./routes/experienceRoute");
const priceRoutes = require("./routes/priceRoutes");
const agentRoutes = require("./routes/agentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const reviewsRoutes = require("./routes/reviewsRoutes");
const applicationsRoutes = require("./routes/applicationsRoutes");
const connectRoutes = require("./routes/connectRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const { handleStripeWebhook } = require("./controllers/webhookController");
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
// Allow both deployed frontend and local dev frontends.
// This avoids CORS blocks when .env contains a production FRONTEND_URL
// but we are running the backend locally.
const rawFrontendUrl = process.env.FRONTEND_URL || "";
const normalizedFrontendUrl = rawFrontendUrl.replace(/\/$/, "");
const allowedOrigins = [
  normalizedFrontendUrl,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser tools (no Origin header), e.g. curl/Postman.
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin);
    return callback(isAllowed ? null : new Error("Not allowed by CORS"), isAllowed);
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(morgan("dev"));

// Stripe webhook MUST be registered with the RAW body and BEFORE express.json(),
// because signature verification needs the unparsed request body.
app.post("/api/webhooks/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


app.get("/", (req, res) => {
    res.send({message: "Server is running" });
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/users", userRoutes);
app.use("/api/users", userRoutes);
app.use("/messages", messageRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/experiences", experienceRoutes);
app.use("/api/connect", connectRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/users/name/:name", userRoutes);

// Socket.IO lets us push events (like "new_message") to the browser the
// moment something happens, instead of the frontend having to keep asking
// the server "anything new?" (polling). It needs the same http server that
// Express uses, so we create that server manually here instead of using
// app.listen() directly.
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

// Every connecting socket must prove who they are with the same JWT used
// for regular API requests. Once verified, we put their socket in a
// "room" named after their user id, so we can later send a message to
// exactly that user with io.to(`user:<id>`).emit(...).
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Missing auth token"));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.userId;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
});

// Other files (like messageController.js) need access to `io` so they can
// emit events when, for example, a new message is sent. Express's app
// object is passed around already, so storing it there is the simplest way
// to share it without a separate module just for this.
app.set("io", io);

// Start the server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});