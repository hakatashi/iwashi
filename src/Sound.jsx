const React = require('react');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const PropTypes = require('prop-types');

module.exports = class Sound extends React.Component {
	static propTypes = {
		src: PropTypes.string.isRequired,
		url: PropTypes.string.isRequired,
		videoStart: PropTypes.number.isRequired,
		videoDuration: PropTypes.number.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.clap = new Howl({
			src: [this.props.src],
		});

		setInterval(this.handleClap, 300);

		this.state = {
			isPlaying: true,
		};
	}

	handleClap = () => {
		if (Math.random() < 0.5) {
			this.clap.play();
			this.player.seekTo(this.props.videoStart);
			if (!this.state.isPlaying) {
				this.setState({isPlaying: true});
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
			<div>
				<Player
					ref={(element) => {
						this.player = element;
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
