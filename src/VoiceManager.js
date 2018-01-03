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
			if (beat === start - 64) {
				this.preloadVocal(source);
			}

			if (beat === start) {
				this.vocalSounds.get(source).stop();
				this.vocalSounds.get(source).seek(0);
				this.vocalSounds.get(source).play();
			}

			if (beat % 16 === 0 && start <= beat && beat <= end) {
				const playbackTime = this.vocalSounds.get(source).seek();
				if (Math.abs((playbackTime + start * TICK) - beat * TICK) > TICK * 2) {
					this.vocalSounds.get(source).seek(beat * TICK - start * TICK);
				}
			}
		}
	}
};
