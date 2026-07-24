require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");
const messageRoutes = require("./routes/messageRoutes");
const listingsRoutes = require("./routes/listingsRoutes");
const bookmarksRoutes = require("./routes/bookmarksRoutes");
const priceRoutes = require("./routes/priceRoutes");
const agentRoutes = require("./routes/agentRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const reviewsRoutes = require("./routes/reviewsRoutes");
const applicationsRoutes = require("./routes/applicationsRoutes");
const experienceRoutes = require("./routes/experienceRoute");
const connectRoutes = require("./routes/connectRoutes");
const paymentsRoutes = require("./routes/paymentsRoutes");
const { handleStripeWebhook } = require("./controllers/webhookController");
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
// In production, restrict CORS to our own frontend. In dev (no FRONTEND_URL),
// stay open so localhost works. This protects the payment API from other sites.
const corsOptions = process.env.FRONTEND_URL
  ? { origin: process.env.FRONTEND_URL, credentials: true }
  : {};
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});