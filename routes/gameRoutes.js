import express from 'express';
const router = express.Router();

// will build this later
import * as gameController from '../controllers/gameController.js';

/** 
 * @route GET /api/games/prompts
 * @desc Get a random word for a user to draw
 */
router.get('/prompts', gameController.getRandomPrompt);

/** 
 * @route POST /api/games/start
 * @desc Initialize a new game session and start the timer
 */
router.post('/start', gameController.startGame);

/** 
 * @route POST /api/games/submit
 * @desc submit the drawing to the ai for checking
 */
router.post('/submit', gameController.submitDrawing);

export default router;
