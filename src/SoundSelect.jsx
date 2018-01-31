/* eslint-disable no-implicit-coercion */

const assert = require('assert');
const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const {default: Player} = require('react-player');
const {Howl} = require('howler');

const soundData = require('../sound/data.yml');
const {getSoundUrls, wait} = require('./util.js');

import './SoundSelect.pcss';

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
		onRefActiveSound: PropTypes.func.isRequired,
	}

	handleClick = (event) => {
		this.props.onClick(event, this.props.name);
	}

	handleRef = (event) => {
		if (this.props.active) {
			this.props.onRefActiveSound(event);
		}
	}

	render() {
		return (
			<div
				styleName={classNames('sound', {active: this.props.active})}
				onClick={this.handleClick}
				ref={this.handleRef}
			>
				<img styleName="thumbnail" src={getThumbnailUrl(this.props.videoUrl)}/>
				<div styleName="description">
					<strong>{this.props.resourceWork}</strong>より<strong>{this.props.resourceName}</strong>
				</div>
			</div>
		);
	}
}

class Tab extends React.Component {
	static propTypes = {
		mode: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node,
		]).isRequired,
		onClick: PropTypes.func.isRequired,
	}

	handleClick = (event) => {
		this.props.onClick(event, this.props.name);
	}

	render() {
		return (
			<div
				styleName={classNames('tab', {active: this.props.mode === this.props.name})}
				onClick={this.handleClick}
			>
				{this.props.children}
			</div>
		);
	}
}

module.exports = class SoundSelect extends React.Component {
	static propTypes = {
		top: PropTypes.number.isRequired,
		left: PropTypes.number.isRequired,
		sound: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
		category: PropTypes.string.isRequired,
		onSelect: PropTypes.func.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.direction = this.props.top > 500 ? 'top' : 'bottom';

		this.updateSound(this.props.sound);
		console.log(this.props.category, soundData[this.props.sound].category);

		this.state = {
			selectedSound: this.props.sound,
			mode: this.props.category === soundData[this.props.sound].category ? 'recommended' : 'all',
			isPlaying: true,
		};

		this.playerState = 'loading';
		this.hasScrolled = false;
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

	updatePlaybackQuality = () => {
		if (this.player) {
			const internalPlayer = this.player.getInternalPlayer();
			if (internalPlayer && internalPlayer.setPlaybackQuality) {
				internalPlayer.setPlaybackQuality('tiny');
			}
		}
	}

	handlePlayerReady = () => {
		this.playerState = 'ready';

		this.updatePlaybackQuality();
		this.player.seekTo(this.soundData.video.start);
	}

	handlePlayerPlay = () => {
		this.playerState = 'start';

		this.sound.stop();
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

	handleClickSound = (event, name) => {
		this.sound.stop();

		if (name === this.state.selectedSound) {
			if (this.playerState !== 'start') {
				return;
			}

			this.player.seekTo(this.soundData.video.start);
			this.setState({isPlaying: true});
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

	handleClickTab = (event, mode) => {
		if (this.state.mode !== mode) {
			this.setState({mode});
		}
	}

	handleRefSounds = (node) => {
		if (!node) {
			return;
		}

		this.soundsNode = node;
		this.scrollToActiveSound();
	}

	handleRefActiveSound = (node) => {
		if (!node) {
			return;
		}

		this.activeSoundOffsetTop = node.offsetTop;
		this.scrollToActiveSound();
	}

	scrollToActiveSound = () => {
		if (!this.hasScrolled && this.soundsNode) {
			this.soundsNode.scrollTop = this.activeSoundOffsetTop - 20;
			this.hasScrolled = true;
		}
	}

	render() {
		return (
			<div
				styleName={classNames('sound-select', this.direction)}
				style={{
					top: this.props.top,
					left: this.props.left,
				}}
			>
				<div
					styleName="content"
					style={{
						transform: `translateX(${Math.max(300, this.props.left) - this.props.left}px)`,
					}}
				>
					<div styleName="preview">
						<Player
							ref={(element) => {
								this.player = element;
								this.updatePlaybackQuality();
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
							onPlay={this.handlePlayerPlay}
						/>
					</div>
					<div styleName="tabs">
						<Tab name="recommended" mode={this.state.mode} onClick={this.handleClickTab}>おすすめ</Tab>
						<Tab name="all" mode={this.state.mode} onClick={this.handleClickTab}>全部</Tab>
					</div>
					<div styleName="sounds" ref={this.handleRefSounds}>
						{Object.entries(soundData).filter(([, sound]) => {
							if (this.props.type === 'percussion') {
								return sound.type === 'percussion';
							}

							if (this.props.type === 'rap') {
								return sound.type === 'rap';
							}

							return sound.type === 'instrument';
						}).filter(([, sound]) => (
							this.state.mode === 'all' || sound.category === this.props.category
						)).map(([name, sound]) => (
							<Sound
								key={name}
								name={name}
								active={this.state.selectedSound === name}
								videoUrl={sound.video.url}
								resourceWork={sound.resource.work}
								resourceName={sound.resource.name}
								onClick={this.handleClickSound}
								onRefActiveSound={this.handleRefActiveSound}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}
};
