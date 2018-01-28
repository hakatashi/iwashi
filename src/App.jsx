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
const Github = require('react-icons/lib/fa/github');
const Modernizr = require('modernizr');

const {TICK} = require('./const.js');
const VocalManager = require('./VocalManager.js');
const {getResourceUrl, wait, isMobile} = require('./util.js');
const songs = require('../songs/index.js');
const params = require('./params.js');
const Track = require('./Track.jsx');
const Loading = require('./Loading.jsx');
const VolumeControls = require('./VolumeControls.jsx');
const SoundSelect = require('./SoundSelect.jsx');

import './App.pcss';

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.song = songs.iwashi;

		this.vocalManagerPromise = VocalManager.initialize(this.song.vocals, this.song.defaultVocal);
		this.tracks = shuffle(Object.entries(this.song.tracks));

		this.selectedSound = null;
		this.isInitialized = false;
		this.clearedIntervals = new Set();

		const size = (() => {
			if (isMobile()) {
				return 'small';
			}

			if (window.innerWidth < 1280) {
				return 'small';
			}

			if (window.innerWidth < 1920) {
				return 'normal';
			}

			return 'large';
		})();

		this.state = {
			beat: null,
			lyric: '',
			soloScore: null,
			trackStatuses: new Map(this.tracks.map(([name]) => [name, 'loading'])),
			sounds: new Map(this.tracks.map(([name, track]) => [name, track.default.sound])),
			size,
			soundSelect: false,
			soundSelectTop: 0,
			soundSelectLeft: 0,
			vocalVolume: 1,
			isFlashing: false,
			isNoVideo: true,
			isReady: false,
			isPaused: false,
			isPlayReady: false,
			isVocalDisabled: false,
		};

		// Modernizr.audioautoplay is async check and we have to manually check if ready
		const checkModernizrInterval = setInterval(() => {
			if (Modernizr.audioautoplay !== undefined) {
				clearInterval(checkModernizrInterval);

				if (Modernizr.audioautoplay === true) {
					this.setState({isPlayReady: true});
				}
			}
		}, 100);
	}

	pause = () => {
		if (this.state.isPaused) {
			return;
		}
		clearInterval(this.handleBeatInterval);
		this.clearedIntervals.add(this.handleBeatInterval);
		this.vocalManager.pause();
		this.setState({isPaused: true});
	}

	unpause = () => {
		if (!this.state.isPaused) {
			return;
		}
		if (this.clearedIntervals.has(this.handleBeatInterval)) {
			this.handleBeatInterval = setInterval(this.handleBeat, TICK * 1000);
		}
		this.vocalManager.unpause();
		this.setState({isPaused: false});
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat === null ? TICK * 0 : this.state.beat + TICK});

		const beat = Math.floor(this.state.beat / TICK) % 2944;
		this.vocalManager.handleBeat(beat);

		const lyric = this.song.lyrics.find(({start, end}) => start <= beat && beat < end);
		if (!lyric && this.state.lyric !== '') {
			this.setState({
				lyric: '',
			});
		}

		if (lyric && this.state.lyric !== lyric.text) {
			this.setState({
				lyric: lyric.text,
			});
		}
	}

	handleSoundStatusChanged = async (name, status) => {
		this.setState({trackStatuses: this.state.trackStatuses.set(name, status)});

		if (this.state.soundSelect === false && Array.from(this.state.trackStatuses.values()).every((s) => s === 'ready')) {
			if (this.isInitialized) {
				this.unpause();
			} else {
				this.isInitialized = true;

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
	}

	handleChangeCheckbox = () => {
		this.setState({isNoVideo: !this.state.isNoVideo});
	}

	handleFlash = async () => {
		if (isMobile()) {
			return;
		}

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
		if (isSolo) {
			this.vocalManager.enableNotSolo();
		} else {
			this.vocalManager.disableNotSolo();
		}

		this.setState({
			soloScore: isSolo ? score : null,
			isVocalDisabled: this.vocalManager.isNotSolo || this.vocalManager.isMuted,
		});
	}

	handleChangeVoiceMuted = (isMuted) => {
		if (isMuted) {
			this.vocalManager.mute();
		} else {
			this.vocalManager.unmute();
		}

		this.setState({
			isVocalDisabled: this.vocalManager.isNotSolo || this.vocalManager.isMuted,
		});
	}

	handleChangeVoiceVolume = (volume) => {
		this.vocalManager.setVolume(volume);
		this.setState({
			vocalVolume: this.vocalManager.volume,
		});
	}

	handleClickPause = () => {
		if (this.state.isPaused) {
			this.unpause();
		} else {
			this.pause();
		}
	}

	handleClickChange = (name, target) => {
		this.selectedSound = this.state.sounds.get(name);
		this.setState({
			soundSelect: name,
			soundSelectTop: target.offsetTop + target.offsetHeight / 2,
			soundSelectLeft: target.offsetLeft + target.offsetWidth / 2,
		});
		this.pause();
	}

	handleClickBackdrop = () => {
		const selectedTrack = this.state.soundSelect;

		this.setState({soundSelect: false});

		if (this.selectedSound === this.state.sounds.get(selectedTrack)) {
			if (Array.from(this.state.trackStatuses.values()).every((s) => s === 'ready')) {
				this.unpause();
			}
		} else {
			this.setState({
				sounds: this.state.sounds.set(selectedTrack, this.selectedSound),
			});
		}
	}

	handleSoundSelect = (name) => {
		this.selectedSound = name;
	}

	handleClickOk = () => {
		this.setState({isPlayReady: true});
	}

	render() {
		return (
			<div styleName={classNames('app', {flash: this.state.isFlashing})}>
				<Loading
					titleComponents={this.song.titleComponents}
					statuses={this.tracks.map(([name]) => this.state.trackStatuses.get(name))}
					name="iwashi"
					vanishing={this.state.isReady}
					isPlayReady={this.state.isPlayReady}
					onClickOk={this.handleClickOk}
				/>
				<div styleName="main">
					<div styleName="tracks-container">
						<div styleName="tracks">
							{this.tracks.map(([name, track]) => (
								<Track
									key={name}
									name={name}
									{...track}
									sound={this.state.sounds.get(name)}
									beat={this.state.beat}
									size={this.state.size}
									onFlash={this.handleFlash}
									onChangeSolo={this.handleChangeSolo}
									onChangeStatus={this.handleSoundStatusChanged}
									onClickChange={this.handleClickChange}
									isReady={this.state.isReady}
									isPaused={this.state.isPaused}
									isNoVideo={this.state.isNoVideo}
									isNotSolo={this.state.soloScore !== null && this.state.soloScore !== name}
									isPlayReady={this.state.isPlayReady}
								/>
							))}
						</div>
						{this.state.soundSelect && (
							<React.Fragment>
								<div styleName="backdrop" onClick={this.handleClickBackdrop}/>
								<SoundSelect
									top={this.state.soundSelectTop}
									left={this.state.soundSelectLeft}
									type={this.song.tracks[this.state.soundSelect].type}
									sound={this.state.sounds.get(this.state.soundSelect)}
									onSelect={this.handleSoundSelect}
								/>
							</React.Fragment>
						)}
					</div>
					<div styleName="lyric">
						<div styleName="character">
							<img
								styleName={classNames('character-image', {
									disabled: this.state.isVocalDisabled,
								})}
								src={getResourceUrl('sound/vocal/yufu/character.png')}
							/>
							<div styleName="change unimplemented" title="未実装">
								<Refresh/> かえる
							</div>
						</div>
						<div styleName="lyric-text">
							{this.state.lyric}
						</div>
						<div styleName="lyric-controls">
							<VolumeControls
								volume={this.state.vocalVolume}
								isMuted={false}
								isSolo={false}
								onChangeMuted={this.handleChangeVoiceMuted}
								onChangeVolume={this.handleChangeVoiceVolume}
							/>
						</div>
					</div>
				</div>
				<div styleName="controls">
					<div styleName="playback">
						<div styleName="button unimplemented" title="未実装">
							<StepBackward/>
						</div>
						<div styleName="button" onClick={this.handleClickPause}>
							{this.state.isPaused ? (
								<Play/>
							) : (
								<Pause/>
							)}
						</div>
						<div styleName="button unimplemented" title="未実装">
							<StepForward/>
						</div>
					</div>
					<div styleName="title">
						♪{this.song.title}／{this.song.artist}
						<div styleName="change unimplemented" title="未実装">
							<Refresh/> かえる
						</div>
					</div>
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
					<a styleName="github button" href="https://github.com/hakatashi/iwashi" rel="noopener noreferrer" target="_blank">
						<Github/>
					</a>
				</div>
			</div>
		);
	}
};
