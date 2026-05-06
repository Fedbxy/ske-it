import User from "../models/userModel.js";
import Match from "../models/matchModel.js";

/**
 * POST /api/leaderboard (Redirection target) — Record game completion
 */
export async function submitGame(req, res, next) {
  try {
    // If user is logged in, update their record
    if (req.session.user) {
      const { score, wordLog } = req.body;
      const gameScore = Number(score) || 0;
      const words = Array.isArray(wordLog) ? wordLog : [];

      const user = await User.findById(req.session.user.id);
      if (user) {
        user.gamesPlayed += 1;
        user.score += gameScore; // Add to career total
        
        const oldHighScore = user.highScore;
        if (gameScore > user.highScore) {
          user.highScore = gameScore;
        }
        await user.save();
        
        // Update session
        req.session.user.score = user.score;
        
        // Log the match to public history
        await Match.create({
          username: user.username,
          score: gameScore,
          wordsDrawn: req.body.roundsPlayed || 0,
          wordLog: words,
        });

        console.log(`[Stats] Game ended for ${user.username}: Score ${gameScore} (Total: ${user.score}, New HighScore: ${user.highScore > oldHighScore ? 'YES' : 'NO'})`);

        return res.status(200).json({ 
          message: "Game recorded", 
          highScore: user.highScore,
          gamesPlayed: user.gamesPlayed 
        });
      }
    }

    // Fallback/Anonymous (optional, but we'll just acknowledge it)
    res.status(200).json({ message: "Game finished" });
  } catch (error) {
    console.error("[Stats] Submit game error:", error);
    next(error);
  }
}

/**
 * GET /api/matches — Get recent matches log
 */
export async function getMatches(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const matches = await Match.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.status(200).json({ matches });
  } catch (error) {
    console.error("[Matches] Fetch error:", error);
    next(error);
  }
}

/**
 * GET /auth/leaderboard or /api/leaderboard — Get top users
 */
export async function getLeaderboard(req, res, next) {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    // Swapped: now defaults to highScore
    const type = req.query.type || 'highScore'; 

    const sortField = type === 'score' ? 'score' : 'highScore';
    console.log(`[Leaderboard] Fetching top ${limit} by ${sortField}`);

    const leaderboard = await User.find()
      .sort({ [sortField]: -1, createdAt: 1 })
      .select("username score highScore gamesPlayed createdAt")
      .limit(limit)
      .lean();

    const formatted = leaderboard.map((u, i) => ({
      rank: i + 1,
      username: u.username,
      score: u.score,
      highScore: u.highScore,
      gamesPlayed: u.gamesPlayed,
    }));

    res.status(200).json({ leaderboard: formatted });
  } catch (error) {
    console.error("[Leaderboard] Fetch error:", error);
    next(error);
  }
}
