import mongoose from "mongoose";

export async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set in environment variables.");
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB");
}
