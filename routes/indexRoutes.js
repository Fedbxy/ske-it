import express from "express";
import User from "../models/userModel.js";
const router = express.Router();

// GET /
router.get("/", (req, res) => {
  res.render("index");
});

// GET /login
router.get("/login", (req, res) => {
  res.render("login");
});

// GET /dashboard
router.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  try {
    const user = await User.findById(req.session.user.id).lean();
    if (!user) {
      return res.redirect("/login");
    }
    res.render("dashboard", { user });
  } catch (error) {
    console.error("[Dashboard] Error fetching fresh user:", error);
    res.render("dashboard", { user: req.session.user }); // Fallback
  }
});

// GET /game
router.get("/game", async (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.redirect("/login");
  }
  
  try {
    const user = await User.findById(req.session.user.id).lean();
    res.render("game", { user: user || req.session.user });
  } catch (error) {
    res.render("game", { user: req.session.user });
  }
});

// GET /leaderboard
router.get("/leaderboard", (req, res) => {
  res.render("leaderboard");
});

// GET /matches
router.get("/matches", (req, res) => {
  res.render("matches");
});

export default router;