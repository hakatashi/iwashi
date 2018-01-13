const {Howl} = require('howler');

const {getSoundUrls} = require('./util.js');
const {TICK} = require('./const.js');

const VoiceManager = class VoiceManager {
	static initialize = (vocals, initialVocal) => (
		new Promise((resolve) => {
			const voiceManager = new VoiceManager({
				vocals,
				initialVocal,
				onReady: () => {
					resolve(voiceManager);
				},
			});
		})
	)

	constructor({vocals, initialVocal, onReady}) {
		this.vocals = vocals;
		this.vocalName = initialVocal;
		this.onReady = onReady;
		this.vocalSounds = new Map();

		// Load first vocal and call onReady after loading
		this.isReady = false;
		this.loadVocal();
	}

	getResourceName = (source) => (
		`vocal/${this.vocalName}/${source}`
	)

	loadVocal = () => {
		const vocals = this.vocals[this.vocalName];
		const vocal = vocals.find((v) => !this.vocalSounds.has(this.getResourceName(v.source)));

		if (!vocal) {
			return;
		}

		const howl = new Howl({
			src: getSoundUrls(this.getResourceName(vocal.source)),
			volume: 1.3,
			onload: () => {
				if (!this.isReady) {
					this.isReady = true;
					this.onReady();
				}

				this.loadVocal();
			},
		});

		this.vocalSounds.set(this.getResourceName(vocal.source), howl);
	}

	handleBeat(beat) {
		for (const {source, start, end} of this.vocals[this.vocalName]) {
			if (this.vocalSounds.has(this.getResourceName(source))) {
				const vocalSound = this.vocalSounds.get(this.getResourceName(source));

				if (beat === start) {
					vocalSound.stop();
					vocalSound.seek(0);
					vocalSound.play();
				}

				if (beat % 16 === 0 && start <= beat && beat <= end) {
					const playbackTime = vocalSound.seek();
					if (Math.abs((playbackTime + start * TICK) - beat * TICK) > TICK) {
						vocalSound.seek(beat * TICK - start * TICK);
					}
				}
			}
		}
	}
};

module.exports = VoiceManager;
