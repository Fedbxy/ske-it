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

export default router;