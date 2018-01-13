const qs = require('querystring');
const React = require('react');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const PropTypes = require('prop-types');
const randomColor = require('randomcolor');
const classNames = require('classnames');
const Refresh = require('react-icons/lib/fa/refresh');
const invoke = require('lodash/invoke');

const soundData = require('../sound/data.yml');
const {TICK} = require('./const.js');
const {getSoundUrls, Deferred} = require('./util.js');
const VolumeControls = require('./VolumeControls.jsx');

import './Track.pcss';

module.exports = class Track extends React.Component {
	static propTypes = {
		name: PropTypes.string.isRequired,
		type: PropTypes.oneOf(['percussion', 'instrument', 'chord', 'rap']).isRequired,
		score: PropTypes.array,
		prank: PropTypes.bool,
		start: PropTypes.number,
		end: PropTypes.number,
		default: PropTypes.shape({
			sound: PropTypes.string.isRequired,
			volume: PropTypes.number.isRequired,
		}).isRequired,
		beat: PropTypes.number.isRequired,
		onChangeStatus: PropTypes.func.isRequired,
		onFlash: PropTypes.func.isRequired,
		onChangeSolo: PropTypes.func.isRequired,
		isNoVideo: PropTypes.bool.isRequired,
		isNotSolo: PropTypes.bool.isRequired,
	}

	static defaultProps = {
		score: null,
		prank: false,
		start: null,
		end: null,
	}

	constructor(props, state) {
		super(props, state);

		this.state = {
			volume: this.props.default.volume,
			sound: this.props.default.sound,
			isPlaying: true,
			isReverse: false,
			isShown: true,
			isMuted: false,
			isSolo: false,
		};

		this.videoLoadDefer = new Deferred();
		this.audioLoadDefer = new Deferred();

		const soundLoadPromises = Array(this.props.type === 'chord' ? 5 : 1).fill().map(() => (
			new Promise((resolve, reject) => {
				const howl = new Howl({
					src: getSoundUrls(this.state.sound),
					volume: this.state.volume,
					loop: this.props.type !== 'percussion',
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
		));

		Promise.all(soundLoadPromises).then((sounds) => {
			this.sounds = sounds;
			this.audioLoadDefer.resolve();
		});

		this.currentNoteIndex = null;
		this.currentVelocity;
		this.isError = false;

		const query = qs.parse(location.search.slice(1));
		this.isDebug = Boolean(query.debug);

		Promise.all([
			...(this.isDebug ? [] : [this.videoLoadDefer.promise]),
			this.audioLoadDefer.promise,
		]).then(() => {
			this.props.onChangeStatus(this.props.name, 'ready');
		});
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.beat !== nextProps.beat) {
			this.handleBeat(nextProps.beat);
		}

		if (this.props.isNotSolo === false && nextProps.isNotSolo === true && this.state.isSolo === true) {
			this.setState({
				isSolo: false,
			});
		}
	}

	componentDidUpdate(prevProps, prevState) {
		if (this.state.volume !== prevState.volume || this.state.isMuted !== prevState.isMuted || this.props.isNotSolo !== prevProps.isNotSolo) {
			for (const sound of this.sounds) {
				sound.volume(this.getVolume());
			}
		}
	}

	get soundData() {
		return soundData[this.state.sound];
	}

	handleBeat = (beat) => {
		const tick = Math.floor((beat + TICK / 2) / TICK) % 2944;

		if (Math.abs((beat + TICK) % (TICK * 2944) - TICK) < TICK / 2) {
			this.setState({isShown: false});
			this.sounds.forEach((sound) => sound.stop());
		}

		let hidden = false;

		if (Math.abs(beat % (TICK * 2944) - TICK * 892) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (Math.abs(beat % (TICK * 2944) - TICK * 1408) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (Math.abs(beat % (TICK * 2944) - TICK * 1792) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (Math.abs(beat % (TICK * 2944) - TICK * 2816) < TICK / 2) {
			this.setState({isShown: false});
			hidden = true;
		}

		if (this.props.type === 'percussion') {
			const playNoteIndex = this.props.score.findIndex((note) => Math.abs(note.time - beat % (TICK * 2944)) < TICK / 2 && note.type === 'note');

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
					if (!this.props.isNoVideo) {
						this.player && this.player.seekTo(this.soundData.video.start);
					}
				}

				if ((tick - this.props.start) % 4 === 0) {
					const playbackTime = this.sounds[0].seek();
					const targetTime = ((tick - this.props.start) % (32 * this.soundData.video.duration)) * TICK * 135 / this.soundData.tempo + TICK;
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
			const playNoteIndex = this.props.score.findIndex((note) => Math.abs(note.time - beat % (TICK * 2944)) < TICK / 2 && note.type === 'note');
			const playNotes = this.props.score.filter((note) => Math.abs(note.time - beat % (TICK * 2944)) < TICK / 2 && note.type === 'note');

			if (playNotes.length !== 0 || (this.props.score[this.currentNoteIndex] && Math.abs(this.props.score[this.currentNoteIndex].time + this.props.score[this.currentNoteIndex].duration - beat % (TICK * 2944)) < TICK / 2)) {
				this.sounds.forEach((sound) => sound.stop());
			}

			if (playNotes.length === 0) {
				return;
			}

			this.currentNoteIndex = playNoteIndex;

			playNotes.forEach((note, index) => {
				this.sounds[index].rate(2 ** ((note.noteNumber - this.soundData.sourceNote) / 12));
				this.sounds[index].volume(this.getVolume());
				this.sounds[index].play();
			});
		}

		if (this.props.name === 'cymbal') {
			this.props.onFlash();
		}

		if (!this.props.isNoVideo) {
			this.player && this.player.seekTo(this.soundData.video.start);
		}

		if (!this.state.isShown || hidden) {
			this.setState({isShown: true});
		}

		if (!this.state.isPlaying) {
			this.setState({isPlaying: true});
		}

		if (this.props.prank || this.soundData.prank || this.props.isNoVideo) {
			this.setState({isReverse: !this.state.isReverse});
		}

		const session = Symbol('videoPlaySession');
		this.videoPlaySession = session;

		if (Number.isFinite(this.soundData.video.duration) && !this.props.isNoVideo) {
			setTimeout(() => {
				this.handleVideoSessionTimeout(session);
			}, this.soundData.video.duration * 1000);
		}
	}

	getVolume = () => {
		if (this.state.isMuted || this.props.isNotSolo || this.isError) {
			return 0;
		}

		if (this.props.type === 'rap') {
			return this.state.volume;
		}

		if (this.currentNoteIndex === null) {
			return this.state.volume;
		}

		const playNote = this.props.score[this.currentNoteIndex];

		return playNote.velocity / 100 * this.state.volume;
	}

	handleVideoSessionTimeout = (session) => {
		if (this.videoPlaySession === session && this.state.isPlaying) {
			this.setState({isPlaying: false});
		}
	}

	handlePlayerReady = () => {
		invoke(this.player, ['player', 'player', 'setPlaybackQuality'], 'tiny');
		this.player.seekTo(this.soundData.video.start);

		this.props.onChangeStatus(this.props.name, 'seeking');
	}

	handlePlayerStart = () => {
		if (!this.videoLoadDefer.isResolved) {
			this.setState({
				isPlaying: false,
			});
			this.player.seekTo(this.soundData.video.start);
			this.videoLoadDefer.resolve();
		}
	}

	handlePlayerError = () => {
		this.isError = true;
		for (const sound of this.sounds) {
			sound.volume(this.getVolume());
		}

		if (!this.videoLoadDefer.isResolved) {
			this.videoLoadDefer.resolve();
		}
	}

	handleChangeMuted = (isMuted) => {
		this.setState({isMuted});
	}

	handleChangeSolo = (isSolo) => {
		this.setState({isSolo});
		this.props.onChangeSolo(this.props.name, isSolo);
	}

	render() {
		return (
			<div
				styleName={classNames('track', {muted: this.state.isMuted || this.props.isNotSolo})}
			>
				<div styleName="name">
					{this.props.name}
					<div styleName="change">
						<Refresh/> かえる
					</div>
				</div>
				<div
					styleName="video-area"
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
								invoke(this.player, ['player', 'player', 'setPlaybackQuality'], 'tiny');
							}}
							url={this.soundData.video.url}
							config={{
								youtube: {
									playerVars: {
										start: Math.floor(this.soundData.video.start),
										end: Math.ceil(this.soundData.video.start + this.soundData.video.duration),
									},
								},
							}}
							width={320}
							height={180}
							playing={this.state.isPlaying && !this.props.isNoVideo}
							controls
							muted
							loop
							onReady={this.handlePlayerReady}
							onStart={this.handlePlayerStart}
							onError={this.handlePlayerError}
						/>
					)}
				</div>
				<VolumeControls
					volume={this.state.volume}
					isMuted={this.state.isMuted}
					isSolo={this.state.isSolo}
					onChangeMuted={this.handleChangeMuted}
					onChangeSolo={this.handleChangeSolo}
				/>
			</div>
		);
	}
};
