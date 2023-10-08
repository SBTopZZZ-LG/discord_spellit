// Imports
const {
  EmbedBuilder,
  SlashCommandBuilder,
  CommandInteraction,
} = require("discord.js");
const { ChallengesMap } = require("../models/challenges_map.model");
const { META } = require("../configs/discord_bot.config.json");

// Constants
const instance =
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription(`Aborts the ${META.name} guild challenge`);

// Middlewares

/**
 * @param {CommandInteraction} interaction 
 */
async function handler(interaction) {
  const guildId = interaction.guildId;

  const challenge = ChallengesMap.getGuildChallenge(guildId);
  if (challenge === undefined) {
    interaction.reply({
      ephemeral: true,
      content: `No ongoing ${META.name} challenges at the moment!`,
    });
    return;
  }

  challenge.stopChallenge();
  ChallengesMap.removeGuildChallenge(guildId);
  interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(META.color)
        .setAuthor({
          name: `Stopped by ${interaction.user.username}`,
          iconURL: interaction.user.avatarURL({ size: 32 }),
        })
        .setTitle(`${META.name} Challenge Aborted`),
    ],
  });
}

module.exports = {
  instance,
  handler,
};
