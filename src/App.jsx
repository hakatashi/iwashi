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
const VocalManager = require('./VocalManager.js');
const {getResourceUrl, wait} = require('./util.js');
const songs = require('../songs/index.js');
const VolumeControls = require('./VolumeControls.jsx');

import './App.pcss';

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.song = songs.iwashi;

		this.vocalManagerPromise = VocalManager.initialize(this.song.vocals, this.song.defaultVocal);
		this.tracks = shuffle(Object.entries(this.song.tracks));

		this.state = {
			beat: null,
			lyric: '',
			soloScore: null,
			trackStatuses: new Map(this.tracks.map(([name]) => [name, 'loading'])),
			isFlashing: false,
			isNoVideo: true,
			isReady: false,
			isPaused: false,
			isCharacterAnimating: false,
		};
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat === null ? TICK * 0 : this.state.beat + TICK});

		const beat = Math.floor(this.state.beat / TICK) % 2944;
		this.vocalManager.handleBeat(beat);

		let {isCharacterAnimating} = this.state;

		const lyric = this.song.lyrics.find(({start, end}) => start <= beat && beat < end);
		if (!lyric && this.state.lyric !== '') {
			this.setState({
				lyric: '',
				isCharacterAnimating: false,
			});
			isCharacterAnimating = false;
		}

		if (lyric && this.state.lyric !== lyric.text) {
			this.setState({
				lyric: lyric.text,
				isCharacterAnimating: true,
			});
			isCharacterAnimating = true;
		}

		if (beat % 8 === 0 && isCharacterAnimating) {
			this.setState({isCharacterAnimating: false}, () => {
				wait(0).then(() => {
					this.setState({isCharacterAnimating: true});
				});
			});
		}
	}

	handleSoundStatusChanged = async (name, status) => {
		this.setState({trackStatuses: this.state.trackStatuses.set(name, status)});

		if (Array.from(this.state.trackStatuses.values()).every((s) => s === 'ready')) {
			const vocalManager = await this.vocalManagerPromise;
			this.vocalManager = vocalManager;

			await wait(1000);
			this.setState({isReady: true});

			await wait(3000);
			setInterval(this.handleBeat, TICK * 1000);
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

		await wait(0);

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
					statuses={this.tracks.map(([name]) => this.state.trackStatuses.get(name))}
					name="iwashi"
					vanishing={this.state.isReady}
				/>
				<div styleName="main">
					<div styleName="tracks">
						{this.tracks.map(([name, track]) => (
							<Track
								key={name}
								name={name}
								{...track}
								beat={this.state.beat}
								onChangeStatus={this.handleSoundStatusChanged}
								onFlash={this.handleFlash}
								onChangeSolo={this.handleChangeSolo}
								isReady={this.state.isReady}
								isNoVideo={this.state.isNoVideo}
								isNotSolo={this.state.soloScore !== null && this.state.soloScore !== name}
							/>
						))}
					</div>
					<div styleName="lyric">
						<div styleName="character">
							<img
								styleName={classNames('character-image', {animating: this.state.isCharacterAnimating})}
								src={getResourceUrl('sound/vocal/yufu/character.png')}
							/>
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
