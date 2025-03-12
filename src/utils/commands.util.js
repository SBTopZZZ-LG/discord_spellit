// Imports
const { Client, Collection } = require("discord.js");
const path = require("path");
const fs = require("fs");
const assert = require("assert");

// Constants
const commandsPath = path.join(__dirname, "..", "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((filename) => !filename.startsWith("_"));

// Middlewares
function setupCommands(client) {
	assert(client instanceof Client);

	client.commands = new Collection();
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ("instance" in command && "handler" in command) {
			client.commands.set(command.instance.name, command);
		} else {
			console.log(
				`[WARNING] The command at ${filePath} is missing a required "instance" or "handler" property.`
			);
		}
	}
}

module.exports = {
	commandFiles,
	setupCommands,
};
