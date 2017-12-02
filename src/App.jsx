const React = require('react');
const Sound = require('./Sound.jsx');
const {TICK} = require('./const.js');

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {
			beat: 0,
		};

		setInterval(this.handleBeat, TICK * 1000);
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat + TICK});
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
					isPrank={false}
				/>
				<Sound
					src="karateka-kick.wav"
					url="https://www.youtube.com/watch?v=Cg6dlPZt-1g"
					videoStart={32}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={0.5}
					isPrank={false}
				/>
				<Sound
					src="killme-pyonsuke.wav"
					url="https://www.youtube.com/watch?v=vXBO_W5l6uY"
					videoStart={247.7}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={1}
					isPrank={false}
				/>
				<Sound
					src="ippon-crisp.wav"
					url="https://www.youtube.com/watch?v=2rc8CmeKinc"
					videoStart={23.7}
					videoDuration={1}
					beat={this.state.beat}
					volume={0.5}
					isPrank={false}
				/>
				<Sound
					src="atsumori.wav"
					url="https://www.youtube.com/watch?v=uvg3I_IR9FA"
					videoStart={4.8}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={0.5}
					isPrank
				/>
			</div>
		);
	}
};
