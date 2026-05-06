import express from "express";
import dotenv from "dotenv";
import session from "express-session";
import { connectToDatabase } from "./config/db.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || "skeit_secret_key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", "./views");

import routes from "./routes/index.js";
import apiRoutes from "./routes/api.js";
import authRoutes from "./routes/auth.js";
import drawRoutes from "./routes/draw.js";

app.use("/", routes);
app.use("/api", apiRoutes);
app.use("/api", drawRoutes);
app.use("/auth", authRoutes);

// 404 handler - must come before error handler
app.use((req, res) => {
  // Return JSON for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API endpoint not found" });
  }
  // Render 404 page for other routes
  res.status(404).render("404");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ message: "Internal server error" });
});

connectToDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Ske-It server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB:", error.message);
    process.exit(1);
  });
