const React = require('react');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const PropTypes = require('prop-types');

const scores = require('./scores.js');
console.log(scores);

module.exports = class Sound extends React.Component {
	static propTypes = {
		src: PropTypes.string.isRequired,
		url: PropTypes.string.isRequired,
		videoStart: PropTypes.number.isRequired,
		videoDuration: PropTypes.number.isRequired,
		beat: PropTypes.number.isRequired,
		volume: PropTypes.number.isRequired,
		isPrank: PropTypes.bool.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.sound = new Howl({
			src: [process.env.NODE_ENV === 'production' ? `https://media.githubusercontent.com/media/hakatashi/iwashi/master/wav/${this.props.src}` : `wav/${this.props.src}`],
			volume: this.props.volume,
			loop: this.props.src === 'atsumori.wav',
		});

		this.state = {
			isPlaying: true,
			isReverse: false,
		};
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.beat !== nextProps.beat) {
			this.handleBeat(nextProps.beat);
		}
	}

	handleBeat = (beat) => {
		if (
			(this.props.src === 'kinmoza-clap.wav' && beat % 2 === 1) ||
			(this.props.src === 'karateka-kick.wav' && beat % 2 === 1) ||
			(this.props.src === 'killme-pyonsuke.wav' && beat % 1 === 0) ||
			(this.props.src === 'ippon-crisp.wav' && beat % 1 === 0.5) ||
			(this.props.src === 'atsumori.wav')
		) {
			this.sound.stop();
			if (this.props.src === 'atsumori.wav') {
				const notes = [
					4, 16, 4, 16, -1, 11, -1, 11,
					4, 16, 4, 16, -1, 11, -1, 11,
					4, 16, 4, 16, -1, 11, -1, 11,
					4, 16, 4, 16, -1, 11, -1, 11,
				];
				this.sound.rate(2 ** (notes[(beat * 2) % notes.length] / 12));
			}
			this.sound.play();
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
	}

	handleVideoSessionTimeout = (session) => {
		if (this.videoPlaySession === session) {
			this.setState({isPlaying: false});
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
					width={320}
					height={180}
					playing={this.state.isPlaying}
					controls
					muted
				/>
			</div>
		);
	}
};
