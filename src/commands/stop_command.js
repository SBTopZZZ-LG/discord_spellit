// Imports
const {
  EmbedBuilder,
  SlashCommandBuilder,
  CommandInteraction,
} = require("discord.js");
const { ChallengesMap } = require("../models/challenges_map.model");

// Constants
const instance =
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Aborts the guild challenge");

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
      content: "No ongoing Spell_It challenges at the moment!",
    });
    return;
  }

  challenge.stopChallenge();
  ChallengesMap.removeGuildChallenge(guildId);
  interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("Fuchsia")
        .setAuthor({
          name: `Stopped by ${interaction.user.username}`,
          iconURL: interaction.user.avatarURL({ size: 32 }),
        })
        .setTitle("Spell_It Challenge Aborted"),
    ],
  });
}

module.exports = {
  instance,
  handler,
};
