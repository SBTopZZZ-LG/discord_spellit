// Imports
const { Client, Events, GatewayIntentBits } = require("discord.js");
const { setupCommands } = require("../utils/commands.util");
const { ChallengesMap } = require("../models/challenges_map.model");

// Constants
const { DISCORD_BOT_TOKEN } = process.env;
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

// Middlewares
client.once(Events.ClientReady, _ => {
  console.log("[discord.script]", "Discord bot login success");

  // Setup commands
  setupCommands(client);

  // Listen for interactions
  client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);
    if (!command)
      return console.error(`No command matching ${interaction.commandName} was found.`);

    try {
      await command.handler(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      } else {
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    }
  });

  client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    const challenge = ChallengesMap.getGuildChallenge(message.guildId);
    if (challenge !== null)
      challenge.processGuess(client, message);
  });
});
client.login(DISCORD_BOT_TOKEN);

module.exports = client;
