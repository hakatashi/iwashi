const React = require('react');
const Sound = require('./Sound.jsx');

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {};
	}

	render() {
		return (
			<div>
				<Sound
					src="kinmoza-clap.wav"
					url="https://www.youtube.com/watch?v=STcc8H4Vr_g"
					videoStart={5.3}
				/>
				<Sound
					src="karateka-kick.wav"
					url="https://www.youtube.com/watch?v=Cg6dlPZt-1g"
					videoStart={32}
				/>
			</div>
		);
	}
};
