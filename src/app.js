// Cache environment variables
require("dotenv").config();

console.log("[app]", "Running in", process.env.NODE_ENV?.toUpperCase(), "environment");

// Connect to MongoDB
require("./scripts/mongodb.script");

// Discord bot login
const discordClient = require("./scripts/discord.script");

// Start Express server
const expressApp = require("./scripts/express.script");
