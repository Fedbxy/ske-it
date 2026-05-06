import express from "express";
const router = express.Router();
import { analyzeDrawing } from "../controllers/drawController.js";

/**
 * POST /api/analyze-drawing
 * Sends a drawing to Gemini AI for analysis
 */
router.post("/analyze-drawing", analyzeDrawing);

export default router;
