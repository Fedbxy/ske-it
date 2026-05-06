import mongoose from "mongoose";

const matchSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    wordsDrawn: {
      type: Number,
      default: 0,
      min: 0,
    },
    wordLog: [
      {
        word: String,
        score: Number
      }
    ]
  },
  {
    timestamps: true,
  }
);

matchSchema.index({ createdAt: -1 });

const Match = mongoose.model("Match", matchSchema);

export default Match;
