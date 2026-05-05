import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    roundsPlayed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

scoreSchema.index({ score: -1, createdAt: 1 });

const Score = mongoose.model("Score", scoreSchema);

export default Score;
