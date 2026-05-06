import {googleGenerativeAI} from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

export async function predict(base64Image, wordBank) {
    try {
        // 1. Initialize the multimodal model
        const model = genAI.getGenerativeModel('gemini-1.5-flash');

        // 2. Prepare image data
        // Assuming that function will receive base64 string
        const imageData = {
            inlineData: {
                data: base64Image.split(',')[1], // Remove the data URL prefix
                mimeType: 'image/png' // Adjust if your images are in a different format
            }
        }
        const prompt = `
        You are a drawing recognition expert for a game.
        Look at this user drawing and identify which word from the list below it matches best
        WORD LIST: ${wordBank.join(', ')}
        
        RULES:
        1. If it matches a word in list, return ONLY that word
        2. If it is to messy or doesn't match any thing, return "unknown"
        3. Do not provide any explanation or full sentences, just the word or "unknown"`

        const result = await model.generateContent([prompt, imageData]);
        const response = await result.response;
        const text = response.text().trim().toLowerCase();

        return text;
    }

    catch(error){
        console.error("Gemini AI error", error);
        return "error";
    }
}