const React = require('react');
const classNames = require('classnames');
const shuffle = require('lodash/shuffle');
const Videocam = require('react-icons/lib/md/videocam');
const VideocamOff = require('react-icons/lib/md/videocam-off');
const Refresh = require('react-icons/lib/fa/refresh');
const Play = require('react-icons/lib/fa/play');
const Pause = require('react-icons/lib/fa/pause');
const StepBackward = require('react-icons/lib/fa/step-backward');
const StepForward = require('react-icons/lib/fa/step-forward');

const Track = require('./Track.jsx');
const Loading = require('./Loading.jsx');
const {TICK} = require('./const.js');
const VoiceManager = require('./VoiceManager.js');
const {getResourceUrl} = require('./util.js');
const songs = require('../songs/index.js');
const VolumeControls = require('./VolumeControls.jsx');

import './App.pcss';

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {
			beat: null,
			lyric: '',
			soloScore: null,
			readySounds: new Set(),
			isFlashing: false,
			isNoVideo: true,
			isReady: false,
			isPaused: false,
		};

		this.song = songs.iwashi;

		this.voiceManagerPromise = VoiceManager.initialize(this.song.vocals, this.song.defaultVocal);
		this.tracks = shuffle(Object.entries(this.song.tracks));
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat === null ? TICK * 0 : this.state.beat + TICK});

		const beat = Math.floor(this.state.beat / TICK) % 2944;
		this.voiceManager.handleBeat(beat);

		const lyric = this.song.lyrics.find(({start, end}) => start <= beat && beat < end);
		if (!lyric && this.state.lyric !== '') {
			this.setState({lyric: ''});
		}

		if (lyric && this.state.lyric !== lyric.text) {
			this.setState({lyric: lyric.text});
		}
	}

	handleSoundReady = (score) => {
		this.state.readySounds.add(score);
		this.setState({readySounds: this.state.readySounds});

		if (this.state.readySounds.size === this.tracks.length) {
			this.voiceManagerPromise.then((voiceManager) => {
				this.voiceManager = voiceManager;
				this.setState({isReady: true});
				setInterval(this.handleBeat, TICK * 1000);
			});
		}
	}

	handleChangeCheckbox = () => {
		this.setState({isNoVideo: !this.state.isNoVideo});
	}

	handleFlash = async () => {
		await new Promise((resolve) => {
			this.setState({
				isFlashing: false,
			}, resolve);
		});

		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});

		this.setState({
			isFlashing: true,
		});
	}

	handleChangeSolo = (score, isSolo) => {
		this.setState({
			soloScore: isSolo ? score : null,
		});
	}

	handleChangeVoiceMuted = () => {

	}

	handleClickPause = () => {
		this.setState({
			isPaused: !this.state.isPaused,
		});
	}

	render() {
		return (
			<div styleName={classNames('app', {flash: this.state.isFlashing})}>
				<Loading
					titleComponents={this.song.titleComponents}
					artist={this.song.artist}
					statuses={this.tracks.map(([name]) => this.state.readySounds.has(name) ? 'ready' : 'loading')}
					name="iwashi"
				/>
				<div styleName="main">
					<div styleName="tracks">
						{this.tracks.map(([name, track]) => (
							<Track
								key={name}
								name={name}
								{...track}
								beat={this.state.beat}
								onReady={this.handleSoundReady}
								onFlash={this.handleFlash}
								onChangeSolo={this.handleChangeSolo}
								isNoVideo={this.state.isReady && this.state.isNoVideo}
								isNotSolo={this.state.soloScore !== null && this.state.soloScore !== name}
							/>
						))}
					</div>
					<div styleName="lyric">
						<div styleName="character">
							<img styleName="character-image" src={getResourceUrl('sound/vocal/yufu/character.png')}/>
							<div styleName="change">
								<Refresh/> かえる
							</div>
						</div>
						<div styleName="lyric-text">
							{this.state.lyric}
						</div>
						<div styleName="lyric-controls">
							<VolumeControls
								volume={1}
								isMuted={false}
								isSolo={false}
								onChangeMuted={this.handleChangeVoiceMuted}
							/>
						</div>
					</div>
				</div>
				<div styleName="controls">
					<div styleName="playback">
						<div styleName="button">
							<StepBackward/>
						</div>
						<div styleName="button" onClick={this.handleClickPause}>
							{this.state.isPaused ? (
								<Play/>
							) : (
								<Pause/>
							)}
						</div>
						<div styleName="button">
							<StepForward/>
						</div>
					</div>
					<div styleName="title">♪イワシがつちからはえてくるんだ by ころんば</div>
					<div styleName="play-video" onClick={this.handleChangeCheckbox}>
						{this.state.isNoVideo ? (
							<VideocamOff/>
						) : (
							<Videocam/>
						)} 動画再生
					</div>
				</div>
			</div>
		);
	}
};
