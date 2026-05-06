import Prompt from "../models/promptModel.js";
import aiService from "../services/aiService.js";

export const getRandomPrompt = async (req, res) => {
    // Get one random document from the Prompt collection
    try {
        const count = Prompt.countDocuments();
        const random = Math.floor(Math.random() * count);
        const prompt = await Prompt.findOne().skip(random);

        if (!prompt) {
            return res.status(404).json({message : "No prompts found in database"});
        }

        res.status(200).json({word: prompt.word});
    }
    catch (error) {        
        console.error("Error fetching random prompt:", error);
        res.status(500).json({message: "Server error while fetching random prompt"});
    }
}

export const startGame = (req, res) => {
    // Store the start time in the user's session or return it to be stored in the frontend
    const startTime = Date.now();

    // In a real app, you might want to store this to a database/cache to prevent cheating
    res.status(200).json({
        message: "Game started",
        startTime: startTime,
        limitSeconds: 60
    })
}

export const checkDrawing = async (req, res) => {
    const {drawingData, currentWord} = req.body;

    // 1. Talk to AI service
    const aiGuess = await aiService.predict(drawingData);
    const isCorrect = aiGuess.toLowerCase() === currentWord.toLowerCase();

    if (isCorrect) {
        const nextPrompt = await Prompt.aggregate([{ $sample: { size: 1 } }]);

        return res.json({
            correct: true,
            message: "Nice! Now draw a ...",
            nextWord: nextPrompt[0].word,
            pointsToAdd: 1
        })
    }
    return res.json({
        correct: false,
        guess: aiGuess
    })
}