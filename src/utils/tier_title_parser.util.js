// Imports
const tierList = require("../datasets/tier_list.dataset.json");

// Constants
const keys = Object.keys(tierList).map(key => parseInt(key, 10)).sort((left, right) => left - right);

// Middleware

/**
 * @param {number} score 
 */
function parseTierTitle(score) {
  for (const key of keys)
    if (score < key)
      return tierList[String(key)];
  return "";
}

module.exports = {
  parseTierTitle,
};
