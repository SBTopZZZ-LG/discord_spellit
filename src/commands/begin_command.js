// Imports
const {
  SlashCommandBuilder,
  CommandInteraction,
} = require("discord.js");
const assert = require("assert");

// Constants
const instance = new SlashCommandBuilder()
  .setName("begin")
  .setDescription("Starts the SpellIt challenge");

// Middlewares

/**
 * @param {CommandInteraction} interaction
 */
async function handler(interaction) {
  interaction.reply("Hello World");
}

module.exports = {
  instance,
  handler,
};
