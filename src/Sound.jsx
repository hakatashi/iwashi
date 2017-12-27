const React = require('react');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const PropTypes = require('prop-types');

const scores = require('./scores.js');
const {TICK} = require('./const.js');
const {getSoundUrls} = require('./util.js');

module.exports = class Sound extends React.Component {
	static propTypes = {
		src: PropTypes.string.isRequired,
		url: PropTypes.string.isRequired,
		score: PropTypes.string.isRequired,
		videoStart: PropTypes.number.isRequired,
		videoDuration: PropTypes.number.isRequired,
		beat: PropTypes.number.isRequired,
		volume: PropTypes.number.isRequired,
		sourceNote: PropTypes.number,
		onReady: PropTypes.func.isRequired,
		isPrank: PropTypes.bool,
		isPercussion: PropTypes.bool,
		isChord: PropTypes.bool,
		isNoVideo: PropTypes.bool,
	}

	static defaultProps = {
		sourceNote: 0,
		isPrank: false,
		isChord: false,
		isPercussion: false,
		isNoVideo: false,
	}

	constructor(props, state) {
		super(props, state);

		this.sounds = Array((this.props.isPercussion || this.props.isRap || !this.props.isChord) ? 1 : 5).fill().map(() => (
			new Howl({
				src: getSoundUrls(this.props.src),
				volume: this.props.volume,
				loop: !this.props.isPercussion,
				html5: this.props.isRap,
			})
		));

		this.state = {
			isPlaying: true,
			isReverse: false,
			isShown: true,
		};

		this.currentNote = null;
		this.score = this.props.isRap ? null : scores[this.props.score];
		this.isReady = false;
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.beat !== nextProps.beat) {
			this.handleBeat(nextProps.beat);
		}
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

		if (this.props.isPercussion) {
			const playNote = this.score.find((note) => Math.abs(note.time - beat % (TICK * 2944)) < TICK / 2 && note.type === 'note');

			if (!playNote) {
				return;
			}

			this.sounds[0].volume(playNote.velocity / 100 * this.props.volume);
			this.sounds[0].play();
		} else if (this.props.isRap) {
			if (this.props.rapFrom <= tick && tick < this.props.rapTo) {
				if (!this.sounds[0].playing()) {
					this.setState({
						isPlaying: true,
						isShown: true,
					});

					this.sounds[0].rate(135 / this.props.rapSpeed);
					this.sounds[0].volume(this.props.volume);
					this.sounds[0].seek(0);
					this.sounds[0].play();

					const session = Symbol('videoPlaySession');
					this.videoPlaySession = session;

					if (!this.props.isNoVideo) {
						setTimeout(() => {
							this.handleVideoSessionTimeout(session);
						}, this.props.videoDuration * 1000);
					}
				}

				if ((tick - this.props.rapFrom) % (32 * this.props.rapDuration) === 0) {
					if (!this.props.isNoVideo) {
						this.player && this.player.seekTo(this.props.videoStart);
					}
				}

				if ((tick - this.props.rapFrom) % 4 === 0) {
					const playbackTime = this.sounds[0].seek();
					const targetTime = ((tick - this.props.rapFrom) % (32 * this.props.rapDuration)) * TICK * 135 / this.props.rapSpeed + TICK;
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
			const playNoteIndex = this.score.findIndex((note) => Math.abs(note.time - beat % (TICK * 2944)) < TICK / 2 && note.type === 'note');
			const playNotes = this.score.filter((note) => Math.abs(note.time - beat % (TICK * 2944)) < TICK / 2 && note.type === 'note');

			if (playNotes.length !== 0 || (this.score[this.currentNote] && Math.abs(this.score[this.currentNote].time + this.score[this.currentNote].duration - beat % (TICK * 2944)) < TICK / 2)) {
				this.sounds.forEach((sound) => sound.stop());
			}

			if (playNotes.length === 0) {
				return;
			}

			this.currentNote = playNoteIndex;

			playNotes.forEach((note, index) => {
				this.sounds[index].rate(2 ** ((note.noteNumber - this.props.sourceNote) / 12));
				this.sounds[index].volume(note.velocity / 100 * this.props.volume);
				this.sounds[index].play();
			});
		}

		if (!this.props.isNoVideo) {
			this.player && this.player.seekTo(this.props.videoStart);
		}

		if (!this.state.isShown || hidden) {
			this.setState({isShown: true});
		}

		if (!this.state.isPlaying) {
			this.setState({isPlaying: true});
		}

		if (this.props.isPrank || this.props.isNoVideo) {
			this.setState({isReverse: !this.state.isReverse});
		}

		const session = Symbol('videoPlaySession');
		this.videoPlaySession = session;

		if (Number.isFinite(this.props.videoDuration) && !this.props.isNoVideo) {
			setTimeout(() => {
				this.handleVideoSessionTimeout(session);
			}, this.props.videoDuration * 1000);
		}
	}

	handleVideoSessionTimeout = (session) => {
		if (this.videoPlaySession === session && this.state.isPlaying) {
			this.setState({isPlaying: false});
		}
	}

	handlePlayerReady = () => {
		this.player.player && this.player.player.player && this.player.player.player.setPlaybackQuality && this.player.player.player.setPlaybackQuality('tiny');
		this.player.seekTo(this.props.videoStart);
	}

	handlePlayerStart = () => {
		if (!this.isReady) {
			this.isReady = true;
			this.setState({
				isPlaying: false,
			});
			this.player.seekTo(this.props.videoStart);
			this.props.onReady(this.props.score);
		}
	}

	render() {
		return (
			<div
				style={{
					display: 'inline-block',
					transform: this.state.isReverse ? 'scale(-1, 1)' : 'none',
					visibility: this.state.isShown ? 'visible' : 'hidden',
				}}
			>
				<Player
					ref={(element) => {
						this.player = element;
						this.player && this.player.player && this.player.player.player && this.player.player.player.setPlaybackQuality && this.player.player.player.setPlaybackQuality('tiny');
					}}
					url={this.props.url}
					config={{
						youtube: {
							playerVars: {
								start: Math.floor(this.props.videoStart),
								end: Math.ceil(this.props.videoStart + this.props.videoDuration),
							},
						},
					}}
					width={320}
					height={180}
					playing={this.state.isPlaying && !this.props.isNoVideo}
					controls
					muted
					onReady={this.handlePlayerReady}
					onStart={this.handlePlayerStart}
				/>
			</div>
		);
	}
};
