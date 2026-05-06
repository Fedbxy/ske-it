import express from "express";
const router = express.Router();

import {
  signup,
  signin,
  logout,
  getSession,
} from "../controllers/authController.js";

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/signin
router.post("/signin", signin);

// POST /auth/logout
router.post("/logout", logout);

// GET /auth/session
router.get("/session", getSession);

export default router;
