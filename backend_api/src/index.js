require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");
const messageRoutes = require("./routes/messageRoutes");
const listingsRoutes = require("./routes/listingsRoutes");
const bookmarksRoutes = require("./routes/bookmarksRoutes");
const experienceRoutes = require("./routes/experienceRoute");
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
app.use("/api/experiences", experienceRoutes);
app.use("/api/users/name/:name", userRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});