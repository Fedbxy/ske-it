import express from 'express';
const router = express.Router();

// will build this later
const gameController = require('../controllers/gameController');

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

modules.exports = router;
