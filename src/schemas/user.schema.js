// Imports
const mongoose = require("mongoose");
const { parseTierTitle } = require("../utils/tier_title_parser.util");

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
    default: parseTierTitle(0),
  },
}, {
  timestamps: true,
});
schema.index({ discord_id: 1 });

module.exports = mongoose.model("user", schema);
