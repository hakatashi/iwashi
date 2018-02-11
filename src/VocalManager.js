const {Howl} = require('howler');

const {getSoundUrls} = require('./util.js');
const {TICK} = require('./const.js');

const VoiceManager = class VoiceManager {
	static initialize = (vocals, initialVocal) => new Promise((resolve) => {
		const voiceManager = new VoiceManager({
			vocals,
			initialVocal,
			onReady: () => {
				resolve(voiceManager);
			},
		});
	});

	constructor({vocals, initialVocal, onReady}) {
		this.vocals = vocals;
		this.vocalName = initialVocal;
		this.onReady = onReady;
		this.vocalSounds = new Map();
		this.isSoundPaused = new WeakMap();
		this.volume = 1;
		this.isMuted = false;
		this.isNotSolo = false;

		// Load first vocal and call onReady after loading
		this.isReady = false;
		this.loadVocal();
	}

	getResourceName = (source) => `vocal/${this.vocalName}/${source}`;

	loadVocal = () => {
		const vocals = this.vocals[this.vocalName];
		const vocal = vocals.find(
			(v) => !this.vocalSounds.has(this.getResourceName(v.source))
		);

		if (!vocal) {
			return;
		}

		const howl = new Howl({
			src: getSoundUrls(this.getResourceName(vocal.source)),
			volume: this.getVolume(),
			onload: () => {
				if (!this.isReady) {
					this.isReady = true;
					this.onReady();
				}

				this.loadVocal();
			},
		});

		this.vocalSounds.set(this.getResourceName(vocal.source), howl);
	};

	onBeat(beat) {
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
					if (Math.abs(playbackTime + start * TICK - beat * TICK) > TICK) {
						vocalSound.seek(beat * TICK - start * TICK);
					}
				}
			}
		}
	}

	pause() {
		for (const vocalSound of this.vocalSounds.values()) {
			if (vocalSound.playing()) {
				vocalSound.pause();
				this.isSoundPaused.set(vocalSound, true);
			} else {
				this.isSoundPaused.set(vocalSound, false);
			}
		}
	}

	unpause() {
		for (const vocalSound of this.vocalSounds.values()) {
			if (this.isSoundPaused.get(vocalSound)) {
				vocalSound.play();
			}
		}
	}

	getVolume = () => {
		if (this.isMuted || this.isNotSolo) {
			return 0;
		}

		return this.volume;
	};

	updateVolume = () => {
		for (const vocalSound of this.vocalSounds.values()) {
			vocalSound.volume(this.getVolume());
		}
	};

	mute() {
		this.isMuted = true;
		this.updateVolume();
	}

	unmute() {
		this.isMuted = false;
		this.updateVolume();
	}

	enableNotSolo() {
		this.isNotSolo = true;
		this.updateVolume();
	}

	disableNotSolo() {
		this.isNotSolo = false;
		this.updateVolume();
	}

	setVolume(volume) {
		this.volume = volume;
		this.updateVolume();
	}
};

module.exports = VoiceManager;
