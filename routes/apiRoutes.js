import express from "express";
const router = express.Router();

import { getLeaderboard, submitGame, getMatches } from "../controllers/statsController.js";

// GET /api/leaderboard
router.get("/leaderboard", getLeaderboard);

// POST /api/leaderboard
router.post("/leaderboard", submitGame);

// GET /api/matches
router.get("/matches", getMatches);

// JSON error handler for API routes
router.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(500).json({ message: "Internal server error" });
});

export default router;
