const iwashi = require('./iwashi/data.yml');
const iwashiScore = require('./iwashi/score/index.js');

const parseTime = (timeText, resolution) => {
	const components = timeText.split('.');

	if (components.length === 2) {
		return (parseInt(components[0]) - 1) * resolution + (parseInt(components[1]) - 1) * resolution / 4;
	}

	if (components.length === 3) {
		const subtime = parseFloat(`${components[1]}.${components[2]}`);
		return (parseInt(components[0]) - 1) * resolution + (subtime - 1) * resolution / 4;
	}

	throw new Error(`Invalid time: ${timeText}`);
};

const compileLyrics = (lyricText, resolution) => {
	let currentTime = null;
	const lyrics = [];

	for (const line of lyricText.split('\n')) {
		if (line.startsWith('=')) {
			currentTime = parseTime(line.slice(1), resolution);
			if (lyrics.length >= 1 && lyrics[lyrics.length - 1].end === null) {
				lyrics[lyrics.length - 1].end = currentTime;
			}
		} else if (line.trim() !== '') {
			lyrics.push({
				text: line.trim(),
				start: currentTime,
				end: null,
			});
		}
	}

	return lyrics;
};

const songs = [
	{
		id: 'iwashi',
		song: iwashi,
		score: iwashiScore,
	},
];

for (const {id, song, score} of songs) {
	song.lyrics = compileLyrics(song.lyrics, song.resolution);
	song.score = score;
	module.exports[id] = song;
}
