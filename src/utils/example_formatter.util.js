/**
 * @param {string} input Input to quote
 * @returns {string} Quoted input string
 */
function quoteRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {string} example Example
 * @param {string} word Reference word
 * @param {boolean} censor Whether to censor or highlight the word
 * @returns 
 */
function processExample(example, word, censor = true) {
  const quotedWord = quoteRegex(word);
  const regexp = RegExp(`(^${quotedWord}| +${quotedWord})`, "i");
  const splits = example.split(regexp).filter(phrase => !phrase.trim().toLowerCase().includes(word));
  
  for (let i = 0; i < splits.length; i++)
    if (i + 1 < splits.length && !splits[i].endsWith(' '))
      splits[i] = splits[i] + ' ';
  
  let joined = "";
  if (censor)
    joined = splits.join("\\_".repeat(word.length));
  else
    joined = splits.join(`**${word}**`);
      
  return joined;
}

module.exports = {
  processExample,
};
