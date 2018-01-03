const {Howl} = require('howler');
const noop = require('lodash/noop');

const {getSoundUrls} = require('./util.js');
const {TICK} = require('./const.js');

const VoiceManager = class VoiceManager {
	static initialize = async (vocals) => (
		new Promise((resolve) => {
			const voiceManager = new VoiceManager({
				vocals,
				onReady: () => {
					resolve(voiceManager);
				},
			});
		})
	)

	constructor({vocals, onReady}) {
		this.vocals = vocals;
		this.onReady = onReady;
		this.vocalSounds = new Map();

		// Load first vocal and call onReady after loading
		this.isReady = false;
		this.loadVocal();
	}

	loadVocal = () => {
		const vocal = this.vocals.find((v) => !this.vocalSounds.has(v.source));

		if (!vocal) {
			return;
		}

		const howl = new Howl({
			src: getSoundUrls(vocal.source),
			volume: 1.3,
			onload: () => {
				if (!this.isReady) {
					this.isReady = true;
					this.onReady();
				}

				this.loadVocal();
			},
		});

		this.vocalSounds.set(vocal.source, howl);
	}

	handleBeat(beat) {
		for (const {source, start, end} of this.vocals) {
			if (beat === start && this.vocalSounds.has(source)) {
				this.vocalSounds.get(source).stop();
				this.vocalSounds.get(source).seek(0);
				this.vocalSounds.get(source).play();
			}

			if (beat % 16 === 0 && start <= beat && beat <= end) {
				const playbackTime = this.vocalSounds.get(source).seek();
				if (Math.abs((playbackTime + start * TICK) - beat * TICK) > TICK) {
					this.vocalSounds.get(source).seek(beat * TICK - start * TICK);
				}
			}
		}
	}
};

module.exports = VoiceManager;
