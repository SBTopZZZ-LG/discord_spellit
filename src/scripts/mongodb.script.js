// Imports
const mongoose = require("mongoose");

// Constants
const { MONGODB_URI } = process.env;

console.log(process.env);
console.log(process.env.DISCORD_BOT_TOKEN);
console.log(process.env.DISCORD_CLIENT_SECRET);
console.log(process.env.MONGODB_URI);

// Middlewares

mongoose.connection.on("error", (error) =>
	console.error("[mongodb.script]", error)
);
mongoose.connection.on("connected", () =>
	console.log("[mongodb.script]", "Connected to MongoDB")
);
mongoose.connection.on("disconnected", () =>
	console.log("[mongodb.script]", "Disconnected from MongoDB")
);

mongoose.connect(MONGODB_URI);
