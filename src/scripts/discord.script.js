// Imports
const { Client, Events, GatewayIntentBits } = require("discord.js");

// Constants
const { DISCORD_BOT_TOKEN } = process.env;
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Middlewares
client.once(Events.ClientReady, _ => console.log("[discord.script]", "Discord bot login success"));

client.login(DISCORD_BOT_TOKEN);

module.exports = client;
