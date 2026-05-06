const mongoose = require('mongoose');

const PromptSchema = new mongoose.Schema({
  // The actual word the user needs to draw
  word: {
    type: String,
    required: [true, 'A prompt must have a word'],
    unique: true, // Prevents duplicate words in your database
    trim: true,
    lowercase: true
  }
}, { timestamps: true });

// Export the model so the Controller can use it
module.exports = mongoose.model('Prompt', PromptSchema);