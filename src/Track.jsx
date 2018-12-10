const React = require('react');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const PropTypes = require('prop-types');
const randomColor = require('randomcolor');
const classNames = require('classnames');
const assert = require('assert');
import {MdRefresh} from 'react-icons/md';

const soundData = require('../sound/data.yml');
const {TICK} = require('./const.js');
const {getSoundUrls, Deferred} = require('./util.js');
const params = require('./params.js');
const VolumeControls = require('./VolumeControls.jsx');

import './Track.pcss';

module.exports = class Track extends React.Component {
	static propTypes = {
		name: PropTypes.string.isRequired,
		type: PropTypes.oneOf(['percussion', 'instrument', 'chord', 'rap'])
			.isRequired,
		category: PropTypes.string,
		score: PropTypes.array,
		meanOfNotes: PropTypes.number,
		prank: PropTypes.bool,
		start: PropTypes.number,
		end: PropTypes.number,
		sound: PropTypes.string.isRequired,
		volume: PropTypes.number.isRequired,
		beat: PropTypes.number.isRequired,
		size: PropTypes.string.isRequired,
		onFlash: PropTypes.func.isRequired,
		onChangeSolo: PropTypes.func.isRequired,
		onChangeStatus: PropTypes.func.isRequired,
		onClickChange: PropTypes.func.isRequired,
		onUpdate: PropTypes.func.isRequired,
		isReady: PropTypes.bool.isRequired,
		isPaused: PropTypes.bool.isRequired,
		isNoVideo: PropTypes.bool.isRequired,
		isNotSolo: PropTypes.bool.isRequired,
		isPlayReady: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		category: null,
		score: null,
		meanOfNotes: null,
		prank: false,
		start: null,
		end: null,
	};

	constructor(props, state) {
		super(props, state);

		this.state = {
			volume: this.props.volume,
			isPlaying: true,
			isReverse: false,
			isShown: true,
			isMuted: false,
			isSolo: false,
		};

		this.currentNoteIndex = null;
		this.isError = false;
		this.isDebug = Boolean(params.debug);
		this.isSoundPaused = new WeakMap();
		this.isVideoPaused = false;

		this.updateSound(this.props.sound);
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.beat !== nextProps.beat) {
			this.handleBeat(nextProps.beat);
		}

		if (this.props.isReady === false && nextProps.isReady === true) {
			this.player && this.player.seekTo(this.soundData.video.start);
			this.setState({isShown: false});
		}

		if (
			this.props.isNotSolo === false &&
			nextProps.isNotSolo === true &&
			this.state.isSolo === true
		) {
			this.setState({isSolo: false});
		}

		if (this.props.isPaused === false && nextProps.isPaused === true) {
			this.handlePause();
		}

		if (this.props.isPaused === true && nextProps.isPaused === false) {
			this.handleUnpause();
		}

		if (this.props.sound !== nextProps.sound) {
			this.updateSound(nextProps.sound);
		}

		if (this.props.volume !== nextProps.volume) {
			this.setState({volume: nextProps.volume});
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (
			this.state.volume !== prevState.volume ||
			this.state.isMuted !== prevState.isMuted ||
			this.props.isNotSolo !== prevProps.isNotSolo
		) {
			for (const sound of this.sounds) {
				sound.volume(this.getVolume());
			}

			this.handleUpdate();
		}

		if (this.state.isSolo !== prevState.isSolo) {
			this.handleUpdate();
		}

		if (this.state.isMuted !== prevState.isMuted) {
			this.handleUpdate();
		}
	}

	get soundData() {
		return soundData[this.props.sound];
	}

	updateSound = (sound) => {
		this.videoLoadDefer = new Deferred();
		this.audioLoadDefer = new Deferred();
		this.isError = false;

		Promise.all(
			Array(this.props.type === 'chord' ? 3 : 1)
				.fill()
				.map(
					() => new Promise((resolve, reject) => {
						const howl = new Howl({
							src: getSoundUrls(sound),
							volume: this.state.volume,
							loop:
									this.props.type === 'instrument' ||
									this.props.type === 'chord'
										? soundData[sound].loop === true
										: this.props.type !== 'percussion',
							html5: this.props.type === 'rap',
							preload: true,
							onload: () => {
								resolve(howl);
							},
							onloaderror: (id, error) => {
								reject(error);
							},
						});
					})
				)
		).then((sounds) => {
			this.sounds = sounds;
			this.audioLoadDefer.resolve();
		});

		Promise.all([
			...(this.isDebug ? [] : [this.videoLoadDefer.promise]),
			this.audioLoadDefer.promise,
		]).then(() => {
			// When playing and url props is updated simultaneously, react-player doesn't seem to stop video properly.
			// Is this react-player bug?
			if (this.props.isNoVideo && this.player) {
				this.player.getInternalPlayer().pauseVideo();
			}
			this.props.onChangeStatus(this.props.name, 'ready');
		});
	};

	updatePlaybackQuality = () => {
		if (this.player) {
			const internalPlayer = this.player.getInternalPlayer();
			if (internalPlayer && internalPlayer.setPlaybackQuality) {
				internalPlayer.setPlaybackQuality('tiny');
			}
		}
	};

	handleBeat = (beat) => {
		const tick = Math.floor((beat + TICK / 2) / TICK) % 2944;

		if (Math.abs(((beat + TICK) % (TICK * 2944)) - TICK) < TICK / 2) {
			this.setState({isShown: false});
			for (const sound of this.sounds) {
				sound.stop();
			}
		}

		let hidden = false;

		if (Math.abs((beat % (TICK * 2944)) - TICK * 892) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (Math.abs((beat % (TICK * 2944)) - TICK * 1408) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (Math.abs((beat % (TICK * 2944)) - TICK * 1792) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (Math.abs((beat % (TICK * 2944)) - TICK * 2816) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (this.props.type === 'percussion') {
			const playNoteIndex = this.props.score.findIndex(
				(note) => Math.abs(note.time - (beat % (TICK * 2944))) < TICK / 2 &&
					note.type === 'note'
			);

			if (playNoteIndex === -1) {
				return;
			}

			this.currentNoteIndex = playNoteIndex;

			this.sounds[0].volume(this.getVolume());
			this.sounds[0].play();
		} else if (this.props.type === 'rap') {
			if (this.props.start <= tick && tick < this.props.end) {
				if (!this.sounds[0].playing()) {
					this.setState({
						isPlaying: true,
						isShown: true,
					});

					this.sounds[0].rate(135 / this.soundData.tempo);
					this.sounds[0].volume(this.getVolume());
					this.sounds[0].seek(0);
					this.sounds[0].play();

					const session = Symbol('videoPlaySession');
					this.videoPlaySession = session;

					if (!this.props.isNoVideo) {
						setTimeout(() => {
							this.handleVideoSessionTimeout(session);
						}, this.soundData.video.duration * 1000);
					}
				}

				if ((tick - this.props.start) % (32 * this.props.end) === 0) {
					if (!this.props.isNoVideo && this.player) {
						this.player.seekTo(this.soundData.video.start);
					}
				}

				if ((tick - this.props.start) % 4 === 0) {
					const playbackTime = this.sounds[0].seek();
					const targetTime =
						(((tick - this.props.start) % (32 * this.soundData.duration)) *
							TICK *
							135) /
							this.soundData.tempo +
						TICK;
					if (Math.abs(playbackTime + TICK - targetTime) > TICK) {
						this.sounds[0].seek(targetTime);
					}
				}
			} else if (this.sounds[0].playing()) {
				this.setState({
					isPlaying: false,
					isShown: false,
				});
				this.sounds[0].stop();
			}

			return;
		} else {
			const playNoteIndex = this.props.score.findIndex(
				(note) => Math.abs(note.time - (beat % (TICK * 2944))) < TICK / 2 &&
					note.type === 'note'
			);
			const playNotes = this.props.score.filter(
				(note) => Math.abs(note.time - (beat % (TICK * 2944))) < TICK / 2 &&
					note.type === 'note'
			);

			if (
				playNotes.length !== 0 ||
				(this.props.score[this.currentNoteIndex] &&
					Math.abs(
						this.props.score[this.currentNoteIndex].time +
							this.props.score[this.currentNoteIndex].duration -
							(beat % (TICK * 2944))
					) <
						TICK / 2)
			) {
				for (const sound of this.sounds) {
					sound.stop();
				}
			}

			if (playNotes.length === 0) {
				return;
			}

			this.currentNoteIndex = playNoteIndex;

			// Select the best octave scale based on meanOfNotes and sourceNote
			const noteDifference =
				this.props.meanOfNotes - (this.soundData.sourceNote % 12);
			const downerOctave = Math.floor(noteDifference / 12);
			const upperOctave = Math.ceil(noteDifference / 12);
			assert(downerOctave <= upperOctave);
			const octave =
				noteDifference - downerOctave * 12 > upperOctave * 12 - noteDifference
					? upperOctave
					: downerOctave;

			playNotes.forEach((note, index) => {
				this.sounds[index].rate(
					2 **
						((note.noteNumber -
							octave * 12 -
							(this.soundData.sourceNote % 12)) /
							12)
				);
				this.sounds[index].volume(this.getVolume());
				this.sounds[index].play();
			});
		}

		if (this.props.category === 'cymbal') {
			this.props.onFlash();
		}

		if (!this.props.isNoVideo && this.player) {
			this.player.seekTo(this.soundData.video.start);
		}

		if (!this.state.isShown || hidden) {
			this.setState({isShown: true});
		}

		if (!this.state.isPlaying) {
			this.setState({isPlaying: true});
		}

		if (this.props.prank || this.soundData.prank || this.props.isNoVideo) {
			this.setState(({isReverse}) => ({isReverse: !isReverse}));
		}

		const session = Symbol('videoPlaySession');
		this.videoPlaySession = session;

		if (
			Number.isFinite(this.soundData.video.duration) &&
			!this.props.isNoVideo
		) {
			setTimeout(() => {
				this.handleVideoSessionTimeout(session);
			}, this.soundData.video.duration * 1000);
		}
	};

	handleUpdate = () => {
		this.props.onUpdate(this.props.name, {
			sound: this.props.sound,
			volume: this.state.volume,
			muted: this.state.isMuted,
			solo: this.state.isSolo,
			pan: 0,
		});
	};

	handlePause = () => {
		for (const sound of this.sounds) {
			if (sound.playing()) {
				sound.pause();
				this.isSoundPaused.set(sound, true);
			} else {
				this.isSoundPaused.set(sound, false);
			}
		}

		if (this.state.isPlaying) {
			this.isVideoPaused = true;
			this.setState({isPlaying: false});
		} else {
			this.isVideoPaused = false;
		}
	};

	handleUnpause = () => {
		for (const sound of this.sounds) {
			if (this.isSoundPaused.get(sound)) {
				sound.play();
			}
		}

		if (this.isVideoPaused) {
			this.setState({isPlaying: true});
		}
	};

	getVolume = () => {
		if (
			this.state.isMuted ||
			this.props.isNotSolo ||
			this.isError ||
			this.props.isPaused
		) {
			return 0;
		}

		if (this.props.type === 'rap') {
			return this.state.volume;
		}

		if (this.currentNoteIndex === null) {
			return this.state.volume;
		}

		const playNote = this.props.score[this.currentNoteIndex];

		return (playNote.velocity / 100) * this.state.volume;
	};

	handleVideoSessionTimeout = (session) => {
		if (this.videoPlaySession === session && this.state.isPlaying) {
			this.setState({isPlaying: false});
		}
	};

	handlePlayerReady = () => {
		this.updatePlaybackQuality();
		if (this.props.isPlayReady) {
			this.player.seekTo(this.soundData.video.start);
		}

		this.props.onChangeStatus(this.props.name, 'seeking');
	};

	handlePlayerPlay = () => {
		if (!this.videoLoadDefer.isResolved) {
			this.setState({
				isPlaying: false,
			});
			this.player.seekTo(this.soundData.video.start);
			this.videoLoadDefer.resolve();
		}
	};

	handlePlayerError = () => {
		this.isError = true;
		for (const sound of this.sounds) {
			sound.volume(this.getVolume());
		}

		if (!this.videoLoadDefer.isResolved) {
			this.videoLoadDefer.resolve();
		}
	};

	handleChangeMuted = (isMuted) => {
		this.setState({isMuted});
	};

	handleChangeVolume = (volume) => {
		this.setState({volume});
	};

	handleChangeSolo = (isSolo) => {
		this.setState({isSolo});
		this.props.onChangeSolo(this.props.name, isSolo);
	};

	handleClickChange = (event) => {
		if (this.changeNode) {
			this.props.onClickChange(this.props.name, this.changeNode, event);
		}
	};

	handleChangeRef = (node) => {
		this.changeNode = node;
	};

	render() {
		return (
			<div
				styleName={classNames('track', {
					muted: this.state.isMuted || this.props.isNotSolo,
				})}
			>
				<div styleName="name">
					{this.props.name}
					<div
						styleName="change"
						onClick={this.handleClickChange}
						ref={this.handleChangeRef}
					>
						<MdRefresh/> かえる
					</div>
				</div>
				<div
					styleName={classNames('video-area', this.props.size)}
					style={{
						transform: this.state.isReverse ? 'scale(-1, 1)' : 'none',
						visibility: this.state.isShown ? 'visible' : 'hidden',
						background: randomColor({
							seed: this.props.name,
							luminosity: 'light',
						}),
					}}
				>
					{this.isDebug ? (
						this.props.name.toUpperCase()
					) : (
						<Player
							ref={(element) => {
								this.player = element;
								this.updatePlaybackQuality();
							}}
							url={this.soundData.video.url}
							config={{
								youtube: {
									playerVars: {
										start: Math.floor(this.soundData.video.start),
										end: Math.ceil(
											this.soundData.video.start + this.soundData.video.duration
										),
										modestbranding: 1,
									},
								},
							}}
							width={{small: 192, normal: 192, large: 298}[this.props.size]}
							height={{small: 108, normal: 108, large: 162}[this.props.size]}
							playing={
								this.props.isPlayReady &&
								this.state.isPlaying &&
								(!this.props.isNoVideo || !this.props.isReady)
							}
							controls={this.props.size === 'large'}
							muted
							loop
							onReady={this.handlePlayerReady}
							onPlay={this.handlePlayerPlay}
							onError={this.handlePlayerError}
						/>
					)}
				</div>
				<VolumeControls
					volume={this.state.volume}
					isMuted={this.state.isMuted}
					isSolo={this.state.isSolo}
					onChangeVolume={this.handleChangeVolume}
					onChangeMuted={this.handleChangeMuted}
					onChangeSolo={this.handleChangeSolo}
				/>
			</div>
		);
	}
};
