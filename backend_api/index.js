// index.js
// This is the entry point for the backend server.
// It creates the Express app, applies some middleware, connects the routes,
// and starts listening for requests.

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

// Import the listing routes (all /api/listings endpoints live in here).
const listingsRoutes = require("./src/routes/listingsRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// ----- Middleware (runs on every request, before the routes) -----
app.use(cors());            // let the React frontend call this API
app.use(express.json());    // parse incoming JSON bodies into req.body
app.use(morgan("dev"));     // log each request to the terminal (helpful while testing)

// ----- Routes -----
// Any URL starting with /api/listings is handled by listingsRoutes.
// So router.get("/") inside that file becomes GET /api/listings, etc.
app.use("/api/listings", listingsRoutes);

// A simple health-check route so you can confirm the server is alive.
app.get("/", (req, res) => {
  res.send("Side Hustle API is running");
});

// ----- Start the server -----
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
