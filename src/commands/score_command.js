// Imports
const { SlashCommandBuilder, CommandInteraction, EmbedBuilder } = require("discord.js");
const { UserService } = require("../services/user.service");
const { META } = require("../configs/discord_bot.config.json");

// Constants
const instance =
  new SlashCommandBuilder()
    .setName("score")
    .setDescription("Fetch your current score and title");

// Middleware

/**
 * @param {CommandInteraction} interaction 
 */
async function handler(interaction) {
  const dbUser = await UserService.checkCreateUser(interaction.user);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setThumbnail(META.bannerImageUrl)
        .setColor(META.color)
        .setTitle(`**${interaction.user.username}**'s Score`)
        .setAuthor({
          name: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.avatarURL({ size: 32 }),
        })
        .setFields(
          { name: "Score", value: String(dbUser.score), inline: true },
          { name: "Title", value: dbUser.title, inline: true },
        ),
    ],
  });
}

module.exports = {
  instance,
  handler,
};
