const mapValues = require('lodash/mapValues');
const MMLIterator = require('mml-iterator');

const iwashi = require('./iwashi/data.yml');
const {median} = require('../src/util.js');

const parseTime = (timeText, resolution) => {
	const components = timeText.split('.');

	if (components.length === 2) {
		return (
			(parseInt(components[0]) - 1) * resolution +
			(parseInt(components[1]) - 1) * resolution / 4
		);
	}

	if (components.length === 3) {
		const subtime = parseFloat(`${components[1]}.${components[2]}`);
		return (
			(parseInt(components[0]) - 1) * resolution +
			Math.floor((subtime - 1) * resolution) / 4
		);
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

const compileMml = (text) => {
	// Bug of mml-iterator?
	const fixedText = text.replace(
		/[<>]/g,
		(char) => ({'<': '>', '>': '<'}[char])
	);

	const iterator = new MMLIterator(fixedText);
	const notes = Array.from(iterator);
	return notes;
};

for (const [id, song] of Object.entries({iwashi})) {
	module.exports[id] = {
		...song,
		lyrics: compileLyrics(song.lyrics, song.resolution),
		vocals: mapValues(song.vocals, (vocals) => vocals.map((vocal) => ({
			...vocal,
			start: parseTime(vocal.start, song.resolution),
			end: parseTime(vocal.end, song.resolution),
		}))),
		backgrounds: song.backgrounds.map((background) => ({
			...background,
			time: parseTime(background.time, song.resolution),
		})),
		tracks: mapValues(song.tracks, (track) => ({
			...track,
			...(track.score
				? (() => {
					const score = compileMml(track.score);
					const noteNumbers = score
						.map((note) => note.noteNumber)
						.filter((note) => note !== undefined);
					return {
						score,
						meanOfNotes: median(noteNumbers),
					};
				  })()
				: {}),
			...(track.start ? {start: parseTime(track.start, song.resolution)} : {}),
			...(track.end ? {end: parseTime(track.end, song.resolution)} : {}),
		})),
		clearances: song.clearances.map((clearance) => parseTime(clearance, song.resolution)),
	};
}
