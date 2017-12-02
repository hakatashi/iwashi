const React = require('react');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const PropTypes = require('prop-types');

const scores = require('./scores.js');
const {TICK} = require('./const.js');

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
		isPrank: PropTypes.bool.isRequired,
		isPercussion: PropTypes.bool.isRequired,
	}

	static defaultProps = {
		sourceNote: 0,
	}

	constructor(props, state) {
		super(props, state);

		this.sounds = Array(5).fill().map(() =>
			new Howl({
				src: [process.env.NODE_ENV === 'production' ? `https://media.githubusercontent.com/media/hakatashi/iwashi/master/wav/${this.props.src}` : `wav/${this.props.src}`],
				volume: this.props.volume,
				loop: !this.props.isPercussion,
			}));

		this.state = {
			isPlaying: true,
			isReverse: false,
		};

		this.currentNote = null;
		this.score = scores[this.props.score];
		this.isReady = false;
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.beat !== nextProps.beat) {
			this.handleBeat(nextProps.beat);
		}
	}

	handleBeat = (beat) => {
		if (this.props.isPercussion) {
			const isPlay = this.score.some((note) => Math.abs(note.time - beat % (TICK * 192)) < TICK / 2 && note.type === 'note');

			if (!isPlay) {
				return;
			}

			this.sounds[0].play();
		} else {
			const playNoteIndex = this.score.findIndex((note) => Math.abs(note.time - beat % (TICK * 192)) < TICK / 2 && note.type === 'note');
			const playNotes = this.score.filter((note) => Math.abs(note.time - beat % (TICK * 192)) < TICK / 2 && note.type === 'note');

			if (playNotes.length !== 0 || (this.score[this.currentNote] && Math.abs(this.score[this.currentNote].time + this.score[this.currentNote].duration - beat % (TICK * 192)) < TICK / 2)) {
				this.sounds.forEach((sound) => sound.stop());
			}

			if (playNotes.length === 0) {
				return;
			}

			this.currentNote = playNoteIndex;

			playNotes.forEach((note, index) => {
				this.sounds[index].rate(2 ** ((note.noteNumber - this.props.sourceNote) / 12));
				this.sounds[index].play();
			});
		}

		this.player.seekTo(this.props.videoStart);

		if (!this.state.isPlaying) {
			this.setState({isPlaying: true});
		}

		if (this.props.isPrank) {
			this.setState({isReverse: !this.state.isReverse});
		}

		const session = Symbol('videoPlaySession');
		this.videoPlaySession = session;

		if (Number.isFinite(this.props.videoDuration)) {
			setTimeout(() => {
				this.handleVideoSessionTimeout(session);
			}, this.props.videoDuration * 1000);
		}
	}

	handleVideoSessionTimeout = (session) => {
		if (this.videoPlaySession === session) {
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
			this.props.onReady(this.props.score);
		}
	}

	render() {
		return (
			<div
				style={{
					display: 'inline-block',
					transform: this.state.isReverse ? 'scale(-1, 1)' : 'none',
				}}
			>
				<Player
					ref={(element) => {
						this.player = element;
						this.player && this.player.player && this.player.player.player && this.player.player.player.setPlaybackQuality && this.player.player.player.setPlaybackQuality('tiny');
					}}
					url={this.props.url}
					youtubeConfig={{playerVars: {start: this.props.videoStart}}}
					width={320}
					height={180}
					playing={this.state.isPlaying}
					controls
					muted
					onReady={this.handlePlayerReady}
					onStart={this.handlePlayerStart}
				/>
			</div>
		);
	}
};
