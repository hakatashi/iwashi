const React = require('react');
const Sound = require('./Sound.jsx');

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {
			beat: 0,
		};

		setInterval(this.handleBeat, 222);
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat + 0.5});
	}

	render() {
		return (
			<div>
				<Sound
					src="kinmoza-clap.wav"
					url="https://www.youtube.com/watch?v=STcc8H4Vr_g"
					videoStart={5.3}
					videoDuration={Infinity}
					beat={this.state.beat}
					volume={1}
				/>
				<Sound
					src="karateka-kick.wav"
					url="https://www.youtube.com/watch?v=Cg6dlPZt-1g"
					videoStart={32}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={0.5}
				/>
				<Sound
					src="killme-pyonsuke.wav"
					url="https://www.youtube.com/watch?v=vXBO_W5l6uY"
					videoStart={247.7}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={1}
				/>
				<Sound
					src="ippon-crisp.wav"
					url="https://www.youtube.com/watch?v=2rc8CmeKinc"
					videoStart={23.7}
					videoDuration={1}
					beat={this.state.beat}
					volume={0.5}
				/>
			</div>
		);
	}
};
