import express from "express";
const router = express.Router();

import {
  signup,
  signin,
  logout,
  getSession,
  getLeaderboard
} from "../controllers/authController.js";

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/signin
router.post("/signin", signin);

// POST /auth/logout
router.post("/logout", logout);

// GET /auth/session
router.get("/session", getSession);

// GET /auth/leaderboard
router.get("/leaderboard", getLeaderboard);

export default router;
