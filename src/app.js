// Cache environment variables
require("dotenv").config();

// Connect to MongoDB
require("./scripts/mongodb.script");

// Discord bot login
const discordClient = require("./scripts/discord.script");

// Start Express server
const expressApp = require("./scripts/express.script");
