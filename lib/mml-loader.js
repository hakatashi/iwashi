const MMLIterator = require('mml-iterator');

module.exports = (text) => {
	const iterator = new MMLIterator(text);
	const notes = Array.from(iterator);
	return JSON.stringify(notes);
};
