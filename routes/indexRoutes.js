import express from "express";
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
router.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("dashboard", { user: req.session.user });
});

// GET /game
router.get("/game", (req, res) => {
  // Check if user is authenticated
  if (!req.session.user) {
    return res.redirect("/login");
  }
  res.render("game", { user: req.session.user });
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