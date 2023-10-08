// Imports
const { User } = require("discord.js");
const DbUser = require("../schemas/user.schema");
const { parseTierTitle } = require("../utils/tier_title_parser.util");

// Middleware
class UserService {
  /**
   * @param {User} user
   */
  static async checkCreateUser(user) {
    // Skip if user already exists
    const dbuser = await DbUser.findOne({ discord_id: user.id });
    if (dbuser)
      return dbuser;

    // Create user in db
    return await DbUser.create({
      discord_id: user.id,
      name: user.username,
    });
  }

  /**
   * @param {User} user 
   * @param {number} score 
   */
  static async incrementScore(user, score) {
    const oldScore = (await this.checkCreateUser(user)).score;

    await DbUser.updateOne({ discord_id: user.id }, {
      $inc: { score },
      $set: {
        title: parseTierTitle(oldScore + score),
      },
    });
  }

  /**
   * @param  {...string} users User ids
   * @returns {Promise<Map<string, { score: number, title: string }>>}
   */
  static async fetchScores(...users) {
    const results = {};

    const dbUsers = await DbUser.find({
      discord_id: {
        $in: users,
      },
    });
    for (const user of dbUsers)
      results[user.discord_id] = {
        score: user.score,
        title: user.title,
      };
    
    return results;
  }
}

module.exports = { UserService };
