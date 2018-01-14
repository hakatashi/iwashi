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

const {TICK} = require('./const.js');
const VocalManager = require('./VocalManager.js');
const {getResourceUrl, wait} = require('./util.js');
const songs = require('../songs/index.js');
const params = require('./params.js');
const Track = require('./Track.jsx');
const Loading = require('./Loading.jsx');
const VolumeControls = require('./VolumeControls.jsx');
const VoiceSelect = require('./VoiceSelect.jsx');

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
			voiceSelect: false,
			voiceSelectTop: 0,
			voiceSelectLeft: 0,
			isFlashing: false,
			isNoVideo: true,
			isReady: false,
			isPaused: false,
			isCharacterAnimating: false,
		};
	}

	pause = () => {
		clearTimeout(this.handleBeatInterval);
		this.vocalManager.pause();
		this.setState({isPaused: true});
	}

	unpause = () => {
		this.handleBeatInterval = setInterval(this.handleBeat, TICK * 1000);
		this.vocalManager.unpause();
		this.setState({isPaused: false});
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

			if (!params.debug) {
				await wait(1000);
			}
			this.setState({isReady: true});

			if (!params.debug) {
				await wait(3000);
			}
			this.handleBeatInterval = setInterval(this.handleBeat, TICK * 1000);
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
		if (this.state.isPaused) {
			this.unpause();
		} else {
			this.pause();
		}
	}

	handleClickChange = (name, target) => {
		this.setState({
			voiceSelect: name,
			voiceSelectTop: target.offsetTop + target.offsetHeight / 2,
			voiceSelectLeft: target.offsetLeft + target.offsetWidth / 2,
		});
		this.pause();
	}

	handleClickBackdrop = () => {
		this.setState({voiceSelect: false});
		this.unpause();
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
					<div styleName="tracks-container">
						<div styleName="tracks">
							{this.tracks.map(([name, track]) => (
								<Track
									key={name}
									name={name}
									{...track}
									beat={this.state.beat}
									onFlash={this.handleFlash}
									onChangeSolo={this.handleChangeSolo}
									onChangeStatus={this.handleSoundStatusChanged}
									onClickChange={this.handleClickChange}
									isReady={this.state.isReady}
									isPaused={this.state.isPaused}
									isNoVideo={this.state.isNoVideo}
									isNotSolo={this.state.soloScore !== null && this.state.soloScore !== name}
								/>
							))}
						</div>
						{this.state.voiceSelect && (
							<React.Fragment>
								<div styleName="backdrop" onClick={this.handleClickBackdrop}/>
								<VoiceSelect
									top={this.state.voiceSelectTop}
									left={this.state.voiceSelectLeft}
									type={this.song.tracks[this.state.voiceSelect].type}
									sound={this.song.tracks[this.state.voiceSelect].default.sound}
								/>
							</React.Fragment>
						)}
					</div>
					<div styleName="lyric">
						<div styleName="character">
							<img
								styleName={classNames('character-image', {
									animating: this.state.isCharacterAnimating,
									paused: this.state.isPaused,
								})}
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
					<div styleName={classNames('play-video', {active: !this.state.isNoVideo})} onClick={this.handleChangeCheckbox}>
						{this.state.isNoVideo ? (
							<React.Fragment>
								<VideocamOff/> 動画OFF
							</React.Fragment>
						) : (
							<React.Fragment>
								<Videocam/> 動画ON
							</React.Fragment>
						)}
					</div>
				</div>
			</div>
		);
	}
};
