// Imports
const express = require("express");

// Constants
const Router = express.Router();

// Middlewares
Router.get("/", async (_, res) => res.status(200).send("OK"));

module.exports = Router;
