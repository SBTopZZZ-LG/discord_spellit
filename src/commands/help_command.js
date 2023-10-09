// Imports
const { EmbedBuilder, CommandInteraction, SlashCommandBuilder } = require("discord.js");
const { META } = require("../configs/discord_bot.config.json");

// Constants
const authorAvatarURL = `https://cdn.discordapp.com/avatars/${META.author.discord_id}/cc2d0b4fada35f9eba56e1f30e104513?size=32`;
const instance =
  new SlashCommandBuilder()
    .setName("help")
    .setDescription(`Displays the help message for ${META.name}`);

// Middlewares

/**
 * @param {CommandInteraction} interaction 
 */
async function handler(interaction) {
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setThumbnail(META.bannerImageUrl)
        .setColor(META.color)
        .setAuthor({
          name: `By ${META.author.username}`,
          iconURL: authorAvatarURL,
          url: META.author.url,
        })
        .setTitle(`${META.name} Commands`)
        .setFields(
          { name: "`/help`", value: "Displays this exact message!" },
          { name: "`/begin`", value: `Starts the ${META.name} challenge!` },
          { name: "`/stop`", value: `Stops the ${META.name} challenge!` },
          { name: "`/score`", value: `View your current score at ${META.name}!` },
        ),
    ],
  });
}

module.exports = {
  instance,
  handler,
};
