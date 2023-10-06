// Imports
const mongoose = require("mongoose");

// Constants
const { MONGODB_URI } = process.env;

// Middlewares

mongoose.connection.on("error", error => console.error("[mongodb.script]", error));
mongoose.connection.on("connected", () => console.log("[mongodb.script]", "Connected to MongoDB"));
mongoose.connection.on("disconnected", () => console.log("[mongodb.script]", "Disconnected from MongoDB"));

mongoose.connect(MONGODB_URI);
