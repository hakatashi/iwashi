const mapValues = require('lodash/mapValues');
const iwashi = require('./iwashi/data.yml');

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

for (const [id, song] of Object.entries({iwashi})) {
	module.exports[id] = {
		...song,
		lyrics: compileLyrics(song.lyrics, song.resolution),
		vocals: mapValues(song.vocals, (vocals) => (
			vocals.map((vocal) => ({
				...vocal,
				start: parseTime(vocal.start, song.resolution),
				end: parseTime(vocal.end, song.resolution),
			}))
		)),
		tracks: mapValues(song.tracks, (track) => ({
			...track,
			...(track.start ? {start: parseTime(track.start, song.resolution)} : {}),
			...(track.end ? {end: parseTime(track.end, song.resolution)} : {}),
		})),
		clearances: song.clearances.map((clearance) => (
			parseTime(clearance, song.resolution)
		)),
	};
}
