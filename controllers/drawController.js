import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "" });

/**
 * Utility to delay execution (for retries)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Analyzes a drawing using Gemini AI with retry logic for rate limiting
 */
export async function analyzeDrawing(req, res, next) {
  const { base64Image, targetWord } = req.body;

  if (!base64Image || !targetWord) {
    console.warn("[AI] Request missing base64Image or targetWord");
    return res.status(400).json({ message: "Missing base64Image or targetWord" });
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn("[AI] GEMINI_API_KEY not set. Returning demo response.");
    const demoCorrect = Math.random() < 0.4;
    return res.status(200).json({
      guess: demoCorrect ? targetWord : "something else",
      confidence: demoCorrect ? 0.85 : 0.2,
      isCorrect: demoCorrect,
      feedback: "Keep drawing!",
      demo: true,
    });
  }

  console.log(`[AI] Analyzing drawing for word: "${targetWord}"`);

  const prompt = `Look at this sketch drawing carefully. It was drawn by a human playing a Pictionary-style game.

The player is trying to draw: "${targetWord}"

TASK:
1. EXAMINE the image: List the specific visual elements you see.
2. INDEPENDENT GUESS: Based ONLY on these visual elements, what is your first, unbiased guess?
3. COMPARE: The player intended to draw "${targetWord}".
4. FINAL VERDICT: Is the drawing actually recognizable as "${targetWord}"?

RESPONSE FORMAT:
Respond ONLY in this JSON format (no markdown, no extra text):
{
  "guess": "your best guess",
  "confidence": 0.0 to 1.0,
  "isCorrect": true or false,
  "feedback": "one short encouraging sentence"
}`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const startTime = Date.now();
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/png",
            data: base64Image,
          },
        },
      ]);

      const response = await result.response;
      const rawText = response.text();
      const duration = Date.now() - startTime;
      
      console.log(`[AI] Gemini raw response (${duration}ms):`, rawText);

      // Clean and parse JSON
      const cleaned = rawText.replace(/```json|```/g, "").trim();
      const jsonResult = JSON.parse(cleaned);

      console.log(`[AI] Decoded result: guess="${jsonResult.guess}", isCorrect=${jsonResult.isCorrect}, confidence=${jsonResult.confidence}`);

      return res.status(200).json({
        guess: jsonResult.guess || "unknown",
        confidence: jsonResult.confidence || 0,
        isCorrect: jsonResult.isCorrect === true,
        feedback: jsonResult.feedback || "",
        demo: false,
      });

    } catch (error) {
      attempts++;
      console.error(`[AI] Gemini API error (attempt ${attempts}):`, error.message);

      // Check for rate limit error (429)
      if (error.message?.includes("429") || error.status === 429) {
        if (attempts < maxAttempts) {
          console.log("[AI] Rate limited. Retrying in 2 seconds...");
          await delay(2000);
          continue;
        }
        console.warn("[AI] Rate limit reached after retries.");
        return res.status(429).json({
          message: "AI is currently busy. Please wait a few seconds before trying again.",
          isRateLimited: true
        });
      }

      // Other errors
      if (attempts >= maxAttempts) {
        return res.status(503).json({
          message: "AI service is temporarily unavailable. Please try again later.",
          error: error.message
        });
      }
      
      await delay(1000);
    }
  }
}
