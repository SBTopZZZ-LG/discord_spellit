// Cache environment variables
require("dotenv").config();

// Imports
const { REST, Routes } = require("discord.js");
const fs = require("fs");
const path = require("path");
const { CLIENT_ID } = require("../configs/discord_bot.config.json");

// Constants
const { DISCORD_BOT_TOKEN } = process.env;
const commands = [];

// Grab all the command files from the commands directory
const currentFolder = path.join(__dirname, "..", "commands");
const commandFiles = fs
	.readdirSync(currentFolder)
	.filter((filename) => !filename.startsWith("_"));

for (const file of commandFiles) {
	const filePath = path.join(currentFolder, file);
	const command = require(filePath);
	if ("instance" in command && "handler" in command) {
		commands.push(command.instance.toJSON());
	} else {
		console.log(
			`[WARNING] The command at ${filePath} is missing a required "instance" or "handler" property.`
		);
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(DISCORD_BOT_TOKEN);

// and deploy your commands!
(async () => {
	try {
		console.log(
			`Started refreshing ${commands.length} application (/) commands.`
		);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
			body: commands,
		});

		console.log(
			`Successfully reloaded ${data.length} application (/) commands.`
		);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
