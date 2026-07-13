// index.js
// This is the entry point for the backend server.
// It creates the Express app, applies middleware, connects routes,
// and starts listening for requests.
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const listingsRoutes = require("./src/routes/listingsRoutes");
const bookmarksRoutes = require("./src/routes/bookmarksRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingsRoutes);
app.use("/api/bookmarks", bookmarksRoutes);

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running!" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
