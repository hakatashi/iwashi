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
					score="clap"
					videoStart={5.4}
					videoDuration={Infinity}
					beat={this.state.beat}
					volume={1}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="karateka-kick.wav"
					url="https://www.youtube.com/watch?v=Cg6dlPZt-1g"
					score="snare"
					videoStart={32}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={0.5}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="killme-pyonsuke.wav"
					url="https://www.youtube.com/watch?v=vXBO_W5l6uY"
					score="bass"
					videoStart={247.7}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={1}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="ippon-crisp.wav"
					url="https://www.youtube.com/watch?v=2rc8CmeKinc"
					score="closed-hihat"
					videoStart={23.7}
					videoDuration={1}
					beat={this.state.beat}
					volume={0.5}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="atsumori.wav"
					url="https://www.youtube.com/watch?v=uvg3I_IR9FA"
					score="base"
					videoStart={4.8}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={0.5}
					sourceNote={22}
					isPrank
					isPercussion={false}
				/>
				<Sound
					src="aoba-zoi.wav"
					url="https://www.youtube.com/watch?v=DmZo4rL2E7E"
					score="chord"
					videoStart={19}
					videoDuration={2}
					beat={this.state.beat}
					volume={0.5}
					sourceNote={62}
					isPrank={false}
					isPercussion={false}
				/>
			</div>
		);
	}
};
