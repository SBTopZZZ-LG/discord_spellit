// Imports
const express = require("express");
const cors = require("cors");

// Constants
const { PORT } = process.env;
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Routes
app.use(require("../routes/home.route"));

app.listen(PORT, () =>
	console.log("[express.script]", "Express server running on port", PORT)
);

module.exports = app;
