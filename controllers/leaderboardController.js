import Score from "../models/scoreModel.js";

export async function renderHomePage(req, res, next) {
  try {
    const topScores = await Score.find()
      .sort({ score: -1, createdAt: 1 })
      .limit(10)
      .lean();

    res.render("index", { topScores });
  } catch (error) {
    next(error);
  }
}

export async function submitScore(req, res, next) {
  try {
    const { playerName, score, roundsPlayed } = req.body;
    const normalizedPlayerName = String(playerName || "").trim();

    if (!normalizedPlayerName || score === undefined) {
      return res.status(400).json({
        message: "playerName and score are required",
      });
    }

    const parsedScore = Number(score);
    const parsedRoundsPlayed = roundsPlayed === undefined ? 0 : Number(roundsPlayed);

    if (!Number.isFinite(parsedScore) || parsedScore < 0) {
      return res.status(400).json({
        message: "score must be a non-negative number",
      });
    }

    if (!Number.isFinite(parsedRoundsPlayed) || parsedRoundsPlayed < 0) {
      return res.status(400).json({
        message: "roundsPlayed must be a non-negative number",
      });
    }

    const newScore = await Score.create({
      playerName: normalizedPlayerName,
      score: parsedScore,
      roundsPlayed: parsedRoundsPlayed,
    });

    return res.status(201).json({
      message: "Score saved",
      score: newScore,
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const parsedLimit = Number(req.query.limit);
    const limit = Number.isFinite(parsedLimit)
      ? Math.max(1, Math.min(parsedLimit, 100))
      : 10;

    const leaderboard = await Score.find()
      .sort({ score: -1, createdAt: 1 })
      .limit(limit)
      .lean();

    res.json({ leaderboard });
  } catch (error) {
    next(error);
  }
}
