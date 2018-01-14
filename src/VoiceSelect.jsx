/* eslint-disable no-implicit-coercion */

const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const invoke = require('lodash/invoke');

const soundData = require('../sound/data.yml');
const {getSoundUrls, wait} = require('./util.js');

import './VoiceSelect.pcss';

module.exports = class VoiceSelect extends React.Component {
	static propTypes = {
		top: PropTypes.number.isRequired,
		left: PropTypes.number.isRequired,
		sound: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.direction = this.props.top > 400 ? 'top' : 'bottom';

		this.sound = new Howl({
			src: getSoundUrls(this.props.sound),
			volume: 1,
			loop: false,
			preload: true,
			onend: this.handleSoundEnd,
		});

		this.state = {
			selectedSound: this.props.sound,
			isPlaying: true,
		};
	}

	get soundData() {
		return soundData[this.state.selectedSound];
	}

	getThumbnailUrl = (url) => {
		let matches = null;

		matches = url.match(/^https?:\/\/www\.youtube\.com\/watch\?v=(.+)$/);
		if (matches) {
			return `https://i.ytimg.com/vi/${matches[1]}/1.jpg`;
		}

		return 'https://placehold.it/120x90';
	}

	handlePlayerReady = () => {
		invoke(this.player, ['player', 'player', 'setPlaybackQuality'], 'tiny');
		this.player.seekTo(this.soundData.video.start);
	}

	handlePlayerStart = () => {
		this.sound.play();

		// TODO: session
		wait(this.soundData.video.duration * 1000).then(() => {
			this.sound.stop();
			this.setState({isPlaying: false});
		});
	}

	handleSoundEnd = () => {
		this.setState({isPlaying: false});
	}

	handlePlayerError = () => {
	}
	
	handleClickSound = (name) => {
		
	}

	render() {
		return (
			<div
				styleName={classNames('voice-select', this.direction)}
				style={{
					top: this.props.top,
					left: this.props.left,
				}}
			>
				<div styleName="content">
					<div styleName="preview">
						<Player
							ref={(element) => {
								this.player = element;
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
							width={256}
							height={144}
							playing={this.state.isPlaying}
							controls
							muted
							onReady={this.handlePlayerReady}
							onStart={this.handlePlayerStart}
							onError={this.handlePlayerError}
						/>
					</div>
					<div styleName="sounds">
						{Object.entries(soundData).filter(([, sound]) => {
							if (this.props.type === 'percussion') {
								return sound.type === 'percussion';
							}

							if (this.props.type === 'rap') {
								return sound.type === 'rap';
							}

							return sound.type === 'instrument';
						}).map(([name, sound]) => (
							<div
								key={name}
								styleName={classNames('sound', {active: this.state.selectedSound === name})}
								onClick={this.handleClickSound.bind(name)}
							>
								<img styleName="thumbnail" src={this.getThumbnailUrl(sound.video.url)}/>
								<div styleName="description">
									<strong>{sound.resource.work}</strong>より<strong>{sound.resource.name}</strong>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}
};
