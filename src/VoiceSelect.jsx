/* eslint-disable no-implicit-coercion */

const assert = require('assert');
const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const {default: Player} = require('react-player');
const {Howl} = require('howler');
const invoke = require('lodash/invoke');

const soundData = require('../sound/data.yml');
const {getSoundUrls, wait} = require('./util.js');

import './VoiceSelect.pcss';

const getThumbnailUrl = (url) => {
	let matches = null;

	matches = url.match(/^https?:\/\/www\.youtube\.com\/watch\?v=(.+)$/);
	if (matches) {
		return `https://i.ytimg.com/vi/${matches[1]}/1.jpg`;
	}

	return 'https://placehold.it/120x90';
};

class Sound extends React.Component {
	static propTypes = {
		active: PropTypes.bool.isRequired,
		name: PropTypes.string.isRequired,
		videoUrl: PropTypes.string.isRequired,
		resourceWork: PropTypes.string.isRequired,
		resourceName: PropTypes.string.isRequired,
		onClick: PropTypes.func.isRequired,
	}

	handleClick = (event) => {
		this.props.onClick(event, this.props.name);
	}

	render() {
		return (
			<div
				styleName={classNames('sound', {active: this.props.active})}
				onClick={this.handleClick}
			>
				<img styleName="thumbnail" src={getThumbnailUrl(this.props.videoUrl)}/>
				<div styleName="description">
					<strong>{this.props.resourceWork}</strong>より<strong>{this.props.resourceName}</strong>
				</div>
			</div>
		);
	}
}

module.exports = class VoiceSelect extends React.Component {
	static propTypes = {
		top: PropTypes.number.isRequired,
		left: PropTypes.number.isRequired,
		sound: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		onSelect: PropTypes.func.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.direction = this.props.top > 400 ? 'top' : 'bottom';

		this.updateSound(this.props.sound);

		this.state = {
			selectedSound: this.props.sound,
			isPlaying: true,
		};

		this.playerState = 'loading';
	}

	get soundData() {
		return soundData[this.state.selectedSound];
	}

	updateSound = (name) => {
		this.sound = new Howl({
			src: getSoundUrls(name),
			preload: true,
			onend: this.handleSoundEnd,
		});
	}

	handlePlayerReady = () => {
		this.playerState = 'ready';

		invoke(this.player, ['player', 'player', 'setPlaybackQuality'], 'tiny');
		this.player.seekTo(this.soundData.video.start);
	}

	handlePlayerStart = () => {
		this.playerState = 'start';

		this.sound.play();

		const session = Symbol('soundPlaySession');
		this.soundPlaySession = session;

		wait(this.soundData.video.duration * 1000).then(() => {
			if (this.soundPlaySession !== session) {
				return;
			}

			this.sound.stop();
			this.setState({isPlaying: false});
		});
	}

	handleSoundEnd = () => {
		this.setState({isPlaying: false});
	}

	handlePlayerError = () => {
	}

	handleClickSound = (event, name) => {
		this.sound.stop();

		if (name === this.state.selectedSound) {
			if (this.playerState !== 'start') {
				return;
			}

			this.player.seekTo(this.soundData.video.start);
			this.setState({isPlaying: true});

			this.handlePlayerStart();
		} else {
			assert(name !== this.state.selectedSound);

			this.updateSound(name);

			this.setState({
				selectedSound: name,
				isPlaying: true,
			});

			if (soundData[name].video.url === this.soundData.video.url) {
				this.player.seekTo(soundData[name].video.start);
			} else {
				this.playerStatus = 'loading';
			}

			this.props.onSelect(name);
		}
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
							<Sound
								key={name}
								name={name}
								active={this.state.selectedSound === name}
								videoUrl={sound.video.url}
								resourceWork={sound.resource.work}
								resourceName={sound.resource.name}
								onClick={this.handleClickSound}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}
};
