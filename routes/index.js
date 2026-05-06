import express from "express";
const router = express.Router();

import { renderHomePage } from "../controllers/leaderboardController.js";

router.get("/", renderHomePage);

export default router;