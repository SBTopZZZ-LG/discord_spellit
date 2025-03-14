// Imports
const {
	Client,
	Message,
	AttachmentBuilder,
	EmbedBuilder,
} = require("discord.js");
const gTTS = require("node-gtts")("en-us");
const assert = require("assert");
const { getBufferFromStream } = require("../utils/stream2buf.util");
const { sleep } = require("../utils/sleep.util");
const { processExample } = require("../utils/example_formatter.util");
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
		if (guildId in this.map) return false;

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

			if (challenge.serviceId !== undefined) clearInterval(challenge.serviceId);
		}

		delete this.map[guildId];
	}
}

class ChallengeParams {
	durationPerRound = undefined;
	roundsLeft = undefined;
	multipleGuesses = undefined;

	/**
	 * @param {number} durationPerRound In milliseconds
	 * @returns {ChallengeParams}
	 */
	setDurationPerRound(durationPerRound) {
		this.durationPerRound = durationPerRound;
		return this;
	}

	/**
	 * @param {number} roundsLeft
	 * @returns {ChallengeParams}
	 */
	setRoundsLeft(roundsLeft) {
		this.roundsLeft = roundsLeft;
		return this;
	}

	/**
	 * @param {boolean} multipleGuesses
	 * @returns {ChallengeParams}
	 */
	setMultipleGuesses(multipleGuesses) {
		this.multipleGuesses = multipleGuesses;
		return this;
	}
}

class Challenge {
	guildId = "";
	channelId = "";
	serviceId = undefined;

	// Challenge parameters
	startedBy = undefined;
	startedByAvatarUrl = undefined;
	params = undefined;
	roundsLeft = undefined;
	roundStarted = false;
	roundStartTime = undefined;
	shouldStop = false;
	MAX_SCORE = 100;
	MIN_SCORE = 30;
	POST_ROUND_MAX_RESULTS = 10;

	// Challenge stats
	words = [];
	scores = {};
	correctGuesses = [];
	usersResponded = {};

	/**
	 * @param {string} guildId
	 * @param {string} channelId
	 */
	constructor(guildId, channelId) {
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
	 * @param {ChallengeParams} params
	 * @returns {boolean}
	 */
	beginChallenge(client, startedBy, startedByAvatarUrl, params) {
		if (this.serviceId !== undefined) return false;

		this.startedBy = startedBy;
		this.startedByAvatarUrl = startedByAvatarUrl;
		this.params = params;

		this.roundsLeft = params.roundsLeft;

		this.challengeMainLoop(client);
		return true;
	}

	/**
	 * @param {Client} client
	 */
	async challengeMainLoop(client) {
		if (this.shouldStop) return;

		// Check if the current round is not
		// first round
		if (this.words.length > 0) {
			// Subsequent passes

			// Compute scores
			const authors = {};
			const roundEndTime = Date.now();
			for (const correctGuess of this.correctGuesses) {
				const { message = "", timestamp = 0 } = correctGuess;

				if (!(message.author.id in authors)) {
					authors[message.author.id] = true;
					try {
						message.react("1164200557356007434");
					} catch (error) {
						console.error(error);
					}

					const scoreDelta = this.calculateScoreDelta(
						this.roundStartTime,
						roundEndTime,
						timestamp
					);
					if (!(message.author.id in this.scores))
						this.scores[message.author.id] = scoreDelta;
					else this.scores[message.author.id] += scoreDelta;
				}
			}

			// Send post-round message
			const word = this.words[this.words.length - 1];
			const description = Object.keys(this.scores)
				.sort((left, right) => this.scores[right] - this.scores[left])
				.slice(0, this.POST_ROUND_MAX_RESULTS)
				.map(
					(userId, index) =>
						`**#${index + 1}** <@${userId}> ▶️ +${this.scores[userId]}`
				)
				.join("\n");
			const revealedExample = processExample(
				word.example?.toLowerCase()?.trim() ?? "N/a",
				word.word,
				false
			);
			const channel = await client.channels.fetch(this.channelId);
			channel.send({
				embeds: [
					new EmbedBuilder()
						.setThumbnail(META.bannerImageUrl)
						.setColor(META.color)
						.setTitle(`The #${this.words.length} word was "${word.word}".`)
						.setAuthor({
							name: `Started by ${this.startedBy}`,
							iconURL: this.startedByAvatarUrl,
						})
						.setDescription(
							description.length >= 1
								? description
								: "No one has scored any points yet!"
						)
						.setFields([
							{
								name: "Part of Speech",
								value: `_${word.partOfSpeech}_`,
								inline: true,
							},
							{ name: "Phonetic", value: word.phonetic, inline: true },
							{ name: "Meaning", value: word.meaning },
							{ name: "Example", value: revealedExample },
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
				Object.keys(this.scores).map(async (userId) => {
					return await UserService.incrementScore(
						await client.users.fetch(userId),
						this.scores[userId]
					);
				})
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
								Object.keys(this.scores)
									.slice(0, Math.min(25, Object.keys(this.scores).length))
									.sort((left, right) => this.scores[right] - this.scores[left])
									.map(async (userId) => ({
										name: (await client.users.fetch(userId)).username,
										value: `**${scores[userId]?.score}, ${scores[userId]?.title}** (+${this.scores[userId]})`,
									}))
							)
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
		const processedExample = processExample(
			word.example?.toLowerCase()?.trim(),
			word.word
		);
		const message = await channel.send({
			embeds: [
				new EmbedBuilder()
					.setThumbnail(META.bannerImageUrl)
					.setColor(META.color)
					.setTitle(`Word #${this.words.length}`)
					.setFields(
						{ name: "Part of Speech", value: `_${word.partOfSpeech}_` },
						{ name: "Example", value: processedExample },
						{
							name: "Revealing in",
							value: `**${Math.floor(
								this.params.durationPerRound / 1000
							)} seconds**`,
						}
					),
			],
			files: [
				new AttachmentBuilder()
					.setName("Pronunciation.mp3")
					.setFile(await getBufferFromStream(gTTS.stream(word.word))),
			],
		});
		const start = Date.now();
		this.roundStartTime = start;
		this.roundStarted = true;

		// Update message to reflect time remaining
		const messageUpdateInterval = setInterval(() => {
			if (this.shouldStop) {
				clearInterval(messageUpdateInterval);
				return;
			}
			if (!message.editable) return;

			const remaining = Math.floor(
				(this.params.durationPerRound - (Date.now() - start)) / 1000
			);
			try {
				message.edit({
					embeds: [
						new EmbedBuilder()
							.setThumbnail(META.bannerImageUrl)
							.setColor(META.color)
							.setTitle(`Word #${this.words.length}`)
							.setFields(
								{ name: "Part of Speech", value: `_${word.partOfSpeech}_` },
								{ name: "Example", value: processedExample },
								{ name: "Revealing in", value: `**${remaining} seconds**` }
							),
					],
				});
			} catch (error) {
				console.error(error);
			}
		}, 1000);

		// Round duration
		await sleep(this.params.durationPerRound);
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
		const timestamp = message.createdTimestamp || Date.now();
		if (this.params.multipleGuesses) {
			if (content === this.words[this.words.length - 1].word) {
				const correctGuess = {
					message,
					timestamp,
				};
				this.correctGuesses.push(correctGuess);
			}
		} else if (!(message.author.id in this.usersResponded)) {
			this.usersResponded[message.author.id] = true;
			if (content === this.words[this.words.length - 1].word) {
				const correctGuess = {
					message,
					timestamp,
				};
				this.correctGuesses.push(correctGuess);
			}

			message.react("🔒");
		}
	}

	/**
	 * @param {number} roundStartTime
	 * @param {number} roundEndTime
	 * @param {number} timestamp
	 * @returns {number}
	 */
	calculateScoreDelta(roundStartTime, roundEndTime, timestamp) {
		const duration = roundEndTime - roundStartTime;
		const elapsedTimeUntilAnswer = timestamp - roundStartTime;
		const bias = 1 - elapsedTimeUntilAnswer / duration;
		const scoreDelta = Math.ceil(
			Math.max(this.MIN_SCORE, bias * this.MAX_SCORE)
		);

		return scoreDelta;
	}
}

module.exports = {
	ChallengesMap,
	ChallengeParams,
	Challenge,
};
