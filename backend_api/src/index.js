require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoute");
const messageRoutes = require("./routes/messageRoutes");
const listingsRoutes = require("./routes/listingsRoutes");
const bookmarksRoutes = require("./routes/bookmarksRoutes");
const app = express();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

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

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});