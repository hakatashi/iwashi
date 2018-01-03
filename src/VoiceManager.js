const {getSoundUrls} = require('./util.js');
const {Howl} = require('howler');
const {TICK} = require('./const.js');

module.exports = class VoiceManager {
	constructor(vocals) {
		this.vocals = vocals;
		this.vocalSounds = new Map();
	}

	preloadVocal = (source) => {
		if (this.vocalSounds.has(source)) {
			return;
		}

		const howl = new Howl({
			src: getSoundUrls(source),
			volume: 1.3,
		});

		this.vocalSounds.set(source, howl);
	}

	handleBeat(beat) {
		for (const {source, start, end} of this.vocals) {
			if (Math.abs(beat % (TICK * 2944) - TICK * (start - 64)) < TICK / 2) {
				this.preloadVocal(source);
			}

			if (Math.abs(beat % (TICK * 2944) - TICK * start) < TICK / 2) {
				this.vocalSounds.get(source).stop();
				this.vocalSounds.get(source).seek(0);
				this.vocalSounds.get(source).play();
			}

			if (Math.floor(beat / TICK) % 16 === 0 && TICK * start <= beat % (TICK * 2944) && beat % (TICK * 2944) <= TICK * end) {
				const playbackTime = this.vocalSounds.get(source).seek();
				if (Math.abs((playbackTime + TICK * start) - beat % (TICK * 2944)) > TICK * 2) {
					this.vocalSounds.get(source).seek(beat % (TICK * 2944) - TICK * start);
				}
			}
		}
	}
};
