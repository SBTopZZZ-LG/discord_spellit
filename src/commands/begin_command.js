// Imports
const {
  SlashCommandBuilder,
  CommandInteraction,
  SlashCommandStringOption,
  EmbedBuilder,
  SlashCommandBooleanOption,
} = require("discord.js");
const { ChallengesMap } = require("../models/challenges_map.model");
const { duration1, rounds1 } = require("../utils/interaction_options_parser.util");
const { formatDuration } = require("../utils/duration_formatter.util");
const { META } = require("../configs/discord_bot.config.json");

// Constants
const instance =
  new SlashCommandBuilder()
    .setName("begin")
    .setDescription(`Starts the ${META.name} challenge`)
    .addStringOption(
      new SlashCommandStringOption()
        .setName("duration")
        .setDescription("Amount of time to wait before revealing the answer")
        .setRequired(true)
        .addChoices(
          { name: "15 seconds", value: "t_15s" },
          { name: "30 seconds", value: "t_30s" },
          { name: "45 seconds", value: "t_45s" },
          { name: "1 minute", value: "t_1m" },
          { name: "1 minute 30 seconds", value: "t_1m30s" },
          { name: "2 minutes", value: "t_2m" },
        ),
    )
    .addStringOption(
      new SlashCommandStringOption()
        .setName("rounds")
        .setDescription("Challenge rounds")
        .setRequired(true)
        .addChoices(
          { name: "5 rounds", value: "r_5" },
          { name: "10 rounds", value: "r_10" },
          { name: "15 rounds", value: "r_15" },
          { name: "20 rounds", value: "r_20" },
          { name: "25 rounds", value: "r_25" },
          { name: "30 rounds", value: "r_30" },
          { name: "40 rounds", value: "r_40" },
          { name: "50 rounds", value: "r_50" },
          { name: "60 rounds", value: "r_60" },
          { name: "80 rounds", value: "r_80" },
          { name: "100 rounds", value: "r_100" },
        ),
    )
    .addBooleanOption(
      new SlashCommandBooleanOption()
        .setName("multiple_guesses")
        .setDescription("Allow users to guess the spelling multiple times")
        .setRequired(true),
    );

// Middlewares

/**
 * @param {CommandInteraction} interaction
 */
async function handler(interaction) {
  const duration = duration1[interaction.options.get("duration").value];
  const rounds = rounds1[interaction.options.get("rounds").value];
  const multipleGuesses = interaction.options.get("multiple_guesses")?.value ?? true;

  const guildId = interaction.guildId;
  if (ChallengesMap.registerGuild(guildId, interaction.channelId)) {
    interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setThumbnail(META.bannerImageUrl)
          .setColor(META.color)
          .setTitle(`${META.name} Challenge Started`)
          .setAuthor({
            name: `Started by ${interaction.user.username}`,
            iconURL: interaction.user.avatarURL({ size: 32 }),
          })
          .setFields([
            { name: "Duration per round", value: formatDuration(duration) },
            { name: "No. of Rounds", value: String(rounds) },
            { name: "Multiple guesses allowed", value: (multipleGuesses ? "Yes" : "No") },
          ]),
      ],
    });
    ChallengesMap
      .getGuildChallenge(guildId)
      .beginChallenge(
        interaction.client,
        interaction.user.username,
        interaction.user.avatarURL({ size: 32 }),
        duration,
        rounds,
        multipleGuesses,
      );
  } else
    interaction.reply("The challenge is already started in this guild!");
}

module.exports = {
  instance,
  handler,
};
