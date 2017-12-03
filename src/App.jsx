const React = require('react');
const {Howl} = require('howler');

const Sound = require('./Sound.jsx');
const {TICK} = require('./const.js');
const {getSoundUrl} = require('./util.js');

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {
			beat: null,
		};

		this.readySounds = new Set();
		this.vocal = new Howl({
			src: [getSoundUrl('vocal/yufu/01')],
		});
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat === null ? 0 : this.state.beat + TICK});
		if (Math.abs(this.state.beat % (TICK * 192) - TICK * 61) < TICK / 2) {
			this.vocal.play();
		}
	}

	handleSoundReady = (score) => {
		this.readySounds.add(score);
		if (this.readySounds.size === 8) {
			setInterval(this.handleBeat, TICK * 1000);
		}
	}

	render() {
		return (
			<div>
				<Sound
					src="kinmoza-clap"
					url="https://www.youtube.com/watch?v=STcc8H4Vr_g"
					score="clap"
					videoStart={5.4}
					videoDuration={3}
					beat={this.state.beat}
					volume={1}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="karateka-kick"
					url="https://www.youtube.com/watch?v=Cg6dlPZt-1g"
					score="snare"
					videoStart={32}
					videoDuration={0.3}
					beat={this.state.beat}
					volume={0.5}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="killme-pyonsuke"
					url="https://www.youtube.com/watch?v=vXBO_W5l6uY"
					score="bass"
					videoStart={247.7}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={1}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="ippon-crisp"
					url="https://www.youtube.com/watch?v=2rc8CmeKinc"
					score="closed-hihat"
					videoStart={23.7}
					videoDuration={1}
					beat={this.state.beat}
					volume={0.5}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="atsumori"
					url="https://www.youtube.com/watch?v=uvg3I_IR9FA"
					score="base"
					videoStart={4.8}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={1}
					sourceNote={22}
					onReady={this.handleSoundReady}
					isPrank
					isPercussion={false}
				/>
				<Sound
					src="aoba-zoi"
					url="https://www.youtube.com/watch?v=DmZo4rL2E7E"
					score="chord"
					videoStart={18.9}
					videoDuration={2}
					beat={this.state.beat}
					volume={0.15}
					sourceNote={62}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion={false}
				/>
				<Sound
					src="zen-glass"
					url="https://www.youtube.com/watch?v=M_1UZlPBYzM"
					score="bongo"
					videoStart={24.5}
					videoDuration={0.5}
					beat={this.state.beat}
					volume={0.75}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion
				/>
				<Sound
					src="fireball-ring"
					url="https://www.youtube.com/watch?v=6CQymHcBwWQ"
					score="chime"
					videoStart={477.5}
					videoDuration={3}
					beat={this.state.beat}
					volume={0.75}
					onReady={this.handleSoundReady}
					isPrank={false}
					isPercussion
				/>
			</div>
		);
	}
};
