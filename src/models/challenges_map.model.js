// Imports
const {
  Client,
  Message,
  parseEmoji,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const gTTS = require("node-gtts")("en-us");
const assert = require("assert");
const { getBufferFromStream } = require("../utils/stream2buf.util");
const { sleep } = require("../utils/sleep.util");
const { UserService } = require("../services/user.service");
const { META } = require("../configs/discord_bot.config.json");
const words = require("../datasets/dictionary.dataset.json").data;

// Middlewares
class ChallengesMap {
  static map = {};

  /**
   * @param {string} guildId
   * @param {string} channelId 
   * @returns {boolean}
   */
  static registerGuild(guildId, channelId) {
    if (guildId in this.map)
      return false;

    this.map[guildId] = new Challenge(guildId, channelId);
    return true;
  }

  /**
   * @param {string} guildId 
   * @returns {Challenge | undefined}
   */
  static getGuildChallenge(guildId) {
    return this.map[guildId];
  }

  /**
   * @param {string} guildId
   */
  static removeGuildChallenge(guildId) {
    if (guildId in this.map) {
      // Stop service (if started)
      const challenge = this.map[guildId];
      assert(challenge instanceof Challenge);
      
      if (challenge.serviceId !== undefined)
        clearInterval(challenge.serviceId);
    }

    delete this.map[guildId];
  }
}

class Challenge {
  guildId = "";
  channelId = "";
  serviceId = undefined;

  // Challenge parameters
  startedBy = undefined;
  startedByAvatarUrl = undefined;
  durationPerRound = undefined;
  roundsLeft = undefined;
  multipleGuesses = undefined;
  roundStarted = false;
  shouldStop = false;

  // Challenge stats
  words = [];
  scores = {};
  correctGuesses = [];
  usersResponded = {};

  /**
   * @param {string} guildId 
   * @param {string} channelId
   */
  constructor (guildId, channelId) {
    this.guildId = guildId;
    this.channelId = channelId;
  }

  /**
   * @returns {Map<string, number>} Scores
   */
  getScores() {
    return this.scores;
  }

  /**
   * @returns {string[]} Words
   */
  getWords() {
    return this.words;
  }

  stopChallenge() {
    this.shouldStop = true;
  }

  /**
   * @param {Client} client 
   * @param {string} startedBy 
   * @param {string} startedByAvatarUrl 
   * @param {number} durationPerRound Milliseconds
   * @param {number} roundsLeft
   * @param {boolean} multipleGuesses 
   * @returns {boolean}
   */
  beginChallenge(
    client,
    startedBy,
    startedByAvatarUrl,
    durationPerRound,
    roundsLeft,
    multipleGuesses,
  ) {
    if (this.serviceId !== undefined)
      return false;

    this.startedBy = startedBy;
    this.startedByAvatarUrl = startedByAvatarUrl;
    this.durationPerRound = durationPerRound;
    this.roundsLeft = roundsLeft;
    this.multipleGuesses = multipleGuesses;

    this.challengeMainLoop(client);
    return true;
  }

  /**
   * @param {Client} client 
   */
  async challengeMainLoop(client) {
    if (this.shouldStop)
      return;

    // Check if the current round is not
    // first round
    if (this.words.length > 0) {
      // Subsequent passes

      // Compute scores
      const authors = {};
      for (const message of this.correctGuesses)
        if (!(message.author.id in authors)) {
          authors[message.author.id] = true;
          message.react(parseEmoji('✅'));

          if (!(message.author.id in this.scores))
            this.scores[message.author.id] = 100;
          else
            this.scores[message.author.id] += 100;
        }

      // Send post-round message
      const description = Object.keys(this.scores)
        .sort((left, right) => this.scores[right] - this.scores[left])
        .map((userId, index) => `**#${index + 1}** <@${userId}> ▶️ +${this.scores[userId]}`)
        .join("\n");
      const channel = await client.channels.fetch(this.channelId);
      channel.send({
        embeds: [
          new EmbedBuilder()
            .setThumbnail(META.bannerImageUrl)
            .setColor(META.color)
            .setTitle(`The word was "${this.words[this.words.length - 1].word}".`)
            .setAuthor({
              name: `Started by ${this.startedBy}`,
              iconURL: this.startedByAvatarUrl,
            })
            .setDescription(
              description.length >= 1 ? description : "No one has scored any points yet!"
            )
            .setFields([
              { name: "Phonetic", value: this.words[this.words.length - 1].phonetic ?? "N/a" },
              { name: "Meaning", value: this.words[this.words.length - 1].meaning },
            ]),
        ],
      });
      await sleep(10000);
      
      // Reset parameters
      this.correctGuesses = [];
      this.usersResponded = {};
    } else {
      // First pass
      await sleep(10000);
    }

    // Check if the game has concluded
    if (this.roundsLeft-- === 0) {
      // Update scores in database
      await Promise.all(
        Object.keys(this.scores)
          .map(async userId => {
            return await UserService.incrementScore(
              await client.users.fetch(userId),
              this.scores[userId],
            );
          }),
      );

      // Fetch scores of winners
      const scores = await UserService.fetchScores(...Object.keys(this.scores));

      // Post results
      const channel = await client.channels.fetch(this.channelId);
      await channel.send({
        embeds: [
          new EmbedBuilder()
            .setThumbnail(META.bannerImageUrl)
            .setColor(META.color)
            .setTitle(`${META.name} Challenge Ended`)
            .setAuthor({
              name: `Started by ${this.startedBy}`,
              iconURL: this.startedByAvatarUrl,
            })
            .setFields(
              await Promise.all(
                Object.keys(this.scores).slice(0, Math.min(25, Object.keys(this.scores).length))
                  .sort((left, right) => this.scores[right] - this.scores[left])
                  .map(async userId => ({
                    name: (await client.users.fetch(userId)).username,
                    value: `**${scores[userId]?.score}, ${scores[userId]?.title}** (+${this.scores[userId]})`,
                  })),
              ),
            ),
        ],
      });

      // Unregister challenge from guild
      ChallengesMap.removeGuildChallenge(this.guildId);

      return;
    }

    if (this.shouldStop) return;

    // Pick a word
    const word = words[Math.floor(Math.random() * words.length)];
    this.words.push(word);

    // Push challenge message
    const channel = await client.channels.fetch(this.channelId);
    const message = await channel.send({
      embeds: [
        new EmbedBuilder()
          .setThumbnail(META.bannerImageUrl)
          .setColor(META.color)
          .setTitle(`Word #${this.words.length}`)
          .setDescription(`Revealing the word in **${Math.floor(this.durationPerRound / 1000)} seconds**`),
      ],
      files: [
        new AttachmentBuilder()
          .setName("Pronounciation.mp3")
          .setFile(await getBufferFromStream(gTTS.stream(word.word))),
      ],
    });
    const start = Date.now();
    this.roundStarted = true;

    // Update message to reflect time remaining
    const messageUpdateInterval = setInterval(() => {
      if (this.shouldStop) {
        clearInterval(messageUpdateInterval);
        return;
      }

      const remaining = Math.floor((this.durationPerRound - (Date.now() - start)) / 1000);
      message.edit({
        embeds: [
          new EmbedBuilder()
            .setThumbnail(META.bannerImageUrl)
            .setColor(META.color)
            .setTitle(`Word #${this.words.length}`)
            .setDescription(`Revealing the word in **${remaining} seconds**`),
        ],
      });
    }, 1000);

    // Round duration
    await sleep(this.durationPerRound);
    clearInterval(messageUpdateInterval);

    // Recursive
    if (!this.shouldStop) {
      this.challengeMainLoop(client);
      this.roundStarted = false;
    }
  }

  /**
   * @param {Client} client 
   * @param {Message} message 
   */
  processGuess(client, message) {
    if (this.shouldStop || !this.roundStarted) return;

    const content = message.content.trim().toLowerCase();
    if (this.multipleGuesses) {
      if (content === this.words[this.words.length - 1].word)
        this.correctGuesses.push(message);
    } else
      if (!(message.author.id in this.usersResponded)) {
        this.usersResponded[message.author.id] = true;
        if (content === this.words[this.words.length - 1].word)
          this.correctGuesses.push(message);
      }
  }
}

module.exports = {
  ChallengesMap,
  Challenge,
};
