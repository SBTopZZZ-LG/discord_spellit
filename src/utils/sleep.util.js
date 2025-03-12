/**
 * @param {number} duration Milliseconds to sleep
 */
async function sleep(duration) {
	return new Promise((resolve, _) => setTimeout(resolve, duration));
}

module.exports = { sleep };
