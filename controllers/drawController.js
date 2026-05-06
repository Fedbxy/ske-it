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

  const prompt = `You are an AI referee for a Pictionary-style game. 
Analyze the provided user sketch.

STEP 1: VISUAL ANALYSIS
List the specific visual elements, shapes, and objects you see in the image. Do not assume you know the target word yet.

STEP 2: UNBIASED GUESS
Based solely on the visual evidence from Step 1, provide your primary guess of what this drawing represents.

STEP 3: TARGET COMPARISON
The player was instructed to draw: "${targetWord}". 
Compare your visual analysis to the target word. 

STEP 4: SCORING (BASE QUALITY)
Grade the drawing's quality from 0 to 100. This is a strict linear scale.
100 = Perfect, highly detailed, unambiguous.
75 = Clearly recognizable with moderate detail.
50 = Recognizable but lacks detail.
25 = Recognizable but overly simplistic.
10 = Barely recognizable, ambiguous.
0 = Completely unrecognizable or blank.

STEP 5: VERDICT
Determine if the drawing is recognizable as "${targetWord}". Set to true if the score is 25 or higher, otherwise false.

RESPONSE FORMAT:
Output strictly in the following JSON format.
{
  "reasoning": "Briefly output your Step 1 and Step 3 analysis here.",
  "guess": "Your Step 2 guess",
  "score": integer between 0 and 100,
  "isCorrect": boolean,
  "feedback": "One short encouraging sentence for the player."
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
      
      // AI gives a linear score from 0 to 100
      const linearScore = Math.max(0, Math.min(100, Number(jsonResult.score) || 0));

      // Apply exponential transformation to map 0-100 to 0-500
      // We use a power curve (quadratic) to reward high scores exponentially more than average ones.
      // linearScore = 0   => 500 * (0)^2 = 0
      // linearScore = 50  => 500 * (0.5)^2 = 125
      // linearScore = 100 => 500 * (1)^2 = 500
      const expScore = Math.round(500 * Math.pow(linearScore / 100, 2));

      console.log(`[AI] Decoded result: guess="${jsonResult.guess}", isCorrect=${jsonResult.isCorrect}, linearScore=${linearScore}, expScore=${expScore}`);

      return res.status(200).json({
        guess: jsonResult.guess || "unknown",
        score: expScore,
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
