// Imports
const mongoose = require("mongoose");

// Constants
const schema = new mongoose.Schema({
  discord_id: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    default: "Unknown",
    trim: true,
  },
  score: {
    type: Number,
    default: 0,
  },
  title: {
    type: String,
    default: "Novice",
  },
}, {
  timestamps: true,
});
schema.index({ discord_id: 1 });

module.exports = mongoose.model("user", schema);
