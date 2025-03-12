/**
 * @param {number} millis Milliseconds
 * @returns {string}
 */
function formatDuration(millis) {
	const hours = Math.floor(millis / 3600000);
	const minutes = Math.floor((millis % 3600000) / 60000);
	const seconds = Math.floor((millis % 60000) / 1000);

	if (hours > 0) {
		if (minutes > 0) {
			if (seconds > 0) return `${hours}h ${minutes}m ${seconds}s`;
			else return `${hours}h ${minutes}m`;
		} else if (seconds > 0) return `${hours}h ${seconds}s`;
		else return `${hours}h`;
	} else if (minutes > 0) {
		if (seconds > 0) return `${minutes}m ${seconds}s`;
		else return `${minutes}m`;
	} else if (seconds > 0) return `${seconds}s`;
	else return `NaN`;
}

module.exports = {
	formatDuration,
};
