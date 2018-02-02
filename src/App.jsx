const React = require('react');
const classNames = require('classnames');
const shuffle = require('lodash/shuffle');
const get = require('lodash/get');
const Modernizr = require('modernizr');
const createjs = require('imports-loader?this=>window!exports-loader?window.createjs!preloadjs/lib/preloadjs');

const Videocam = require('react-icons/lib/md/videocam');
const VideocamOff = require('react-icons/lib/md/videocam-off');
const Refresh = require('react-icons/lib/fa/refresh');
const Play = require('react-icons/lib/fa/play');
const Pause = require('react-icons/lib/fa/pause');
const StepBackward = require('react-icons/lib/fa/step-backward');
const StepForward = require('react-icons/lib/fa/step-forward');
const Github = require('react-icons/lib/fa/github');
const Undo = require('react-icons/lib/md/undo');

const {TICK} = require('./const.js');
const VocalManager = require('./VocalManager.js');
const {getResourceUrl, wait, isMobile, Deferred} = require('./util.js');
const songs = require('../songs/index.js');
const params = require('./params.js');
const Track = require('./Track.jsx');
const Loading = require('./Loading.jsx');
const VolumeControls = require('./VolumeControls.jsx');
const SoundSelect = require('./SoundSelect.jsx');
const Tooltip = require('./Tooltip.jsx');
const gist = require('./gist.js');

import './App.pcss';

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.song = songs.iwashi;

		this.vocalManagerPromise = VocalManager.initialize(this.song.vocals, this.song.defaultVocal);
		this.gistDeferred = new Deferred();
		this.backgroundDeferred = new Deferred();

		this.tracks = shuffle(Object.entries(this.song.tracks));

		this.initGist();
		this.initBackground();

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
			trackSounds: new Map(this.tracks.map(([name, track]) => [name, {
				sound: track.default.sound,
				volume: track.default.volume,
				muted: false,
				solo: false,
			}])),
			size,
			soundSelect: false,
			soundSelectTop: 0,
			soundSelectLeft: 0,
			vocalVolume: 1,
			background: this.song.backgrounds[0],
			backgroundAnimation: null,
			backgroundDuration: null,
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

	initGist = async () => {
		if (!params.gist || !params.gist.match(/^[\da-f]{20,}$/)) {
			this.gistDeferred.resolve(null);
			return;
		}

		const data = await gist.load(params.gist);
		this.gistDeferred.resolve(data);
	}

	initBackground = () => {
		const queue = new createjs.LoadQueue();
		queue.loadManifest(this.song.backgrounds.map((b) => b.url).filter((url) => url !== null));
		queue.addEventListener('fileload', () => {
			// Resolves when the first background image is preloaded
			if (!this.backgroundDeferred.isResolved) {
				this.backgroundDeferred.resolve();
			}
		});
	}

	constructTrackSounds = () => {
		if (!this.gistData) {
			return;
		}

		this.setState({
			trackSounds: new Map(this.tracks.map(([name, track]) => [name, {
				sound: String(get(this.gistData, ['songs', 0, 'tracks', name, 'sound'], track.default.sound)),
				volume: Number(get(this.gistData, ['songs', 0, 'tracks', name, 'volume'], track.default.volume)),
				muted: Boolean(get(this.gistData, ['songs', 0, 'tracks', name, 'muted'], false)),
				solo: Boolean(get(this.gistData, ['songs', 0, 'tracks', name, 'solo'], false)),
			}])),
		});
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

		if (!isMobile()) {
			for (const [index, background] of this.song.backgrounds.entries()) {
				if (background.time === beat) {
					const nextBackground = this.song.backgrounds[index + 1];

					new Promise((resolve) => {
						this.setState({
							background,
							backgroundAnimation: null,
							backgroundDuration: nextBackground && (nextBackground.time - background.time) / this.song.resolution * 4 / this.song.bpm * 60,
						}, resolve);
					})
						.then(() => wait(0))
						.then(() => {
							this.setState({backgroundAnimation: background.animation});
						});
					break;
				}
			}
		}
	}

	handleSoundStatusChanged = async (name, status) => {
		this.setState({trackStatuses: this.state.trackStatuses.set(name, status)});

		if (this.state.soundSelect === false && Array.from(this.state.trackStatuses.values()).every((s) => s === 'ready')) {
			if (this.isInitialized) {
				this.unpause();
			} else {
				this.isInitialized = true;

				const [vocalManager, gistData] = await Promise.all([
					this.vocalManagerPromise,
					this.gistDeferred.promise,
					this.backgroundDeferred.promise,
				]);

				this.vocalManager = vocalManager;
				this.gistData = gistData;

				this.constructTrackSounds();

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
		this.selectedSound = this.state.trackSounds.get(name).sound;
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

		if (this.selectedSound === this.state.trackSounds.get(selectedTrack).sound) {
			if (Array.from(this.state.trackStatuses.values()).every((s) => s === 'ready')) {
				this.unpause();
			}
		} else {
			this.setState({
				trackSounds: this.state.trackSounds.set(selectedTrack, {
					...this.state.trackSounds.get(selectedTrack),
					sound: this.selectedSound,
				}),
			});
		}
	}

	handleSoundSelect = (name) => {
		this.selectedSound = name;
	}

	handleClickOk = () => {
		this.setState({isPlayReady: true});
	}

	handleClickDefault = () => {
		this.setState({
			trackSounds: new Map(this.tracks.map(([name, track]) => [name, {
				sound: track.default.sound,
				volume: track.default.volume,
				muted: false,
				solo: false,
			}])),
		});
		this.pause();
	}

	handleUpdateTrack = (name, track) => {
		this.setState({
			trackSounds: this.state.trackSounds.set(name, track),
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
					isPlayReady={this.state.isPlayReady}
					onClickOk={this.handleClickOk}
				/>
				<div styleName="main">
					<div
						styleName={classNames('background', this.state.backgroundAnimation, {paused: this.state.isPaused})}
						style={{
							animationDuration: `${this.state.backgroundDuration}s`,
						}}
					>
						<div
							styleName="background-image"
							style={{
								backgroundImage: `url(${this.state.background.url})`,
								transform: this.state.background.transform,
							}}
						/>
					</div>
					<div styleName="tracks-container">
						<div styleName="tracks">
							{this.tracks.map(([name, track]) => (
								<Track
									key={name}
									name={name}
									{...track}
									sound={this.state.trackSounds.get(name).sound}
									volume={this.state.trackSounds.get(name).volume}
									beat={this.state.beat}
									size={this.state.size}
									onFlash={this.handleFlash}
									onChangeSolo={this.handleChangeSolo}
									onChangeStatus={this.handleSoundStatusChanged}
									onClickChange={this.handleClickChange}
									onUpdate={this.handleUpdateTrack}
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
									category={this.song.tracks[this.state.soundSelect].category}
									sound={this.state.trackSounds.get(this.state.soundSelect).sound}
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
							<Tooltip
								title="未実装"
								position="top"
								duration={100}
								styleName="change unimplemented"
							>
								<Refresh/> かえる
							</Tooltip>
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
						{this.state.background.author && (
							<div styleName="background-info">
								背景: <a href={this.state.background.workUrl} rel="noopener noreferrer" target="_blank">{this.state.background.title}</a> by {this.state.background.author}
							</div>
						)}
					</div>
				</div>
				<div styleName="controls">
					<div styleName="playback">
						<Tooltip
							title="未実装"
							styleName="button unimplemented"
						>
							<StepBackward/>
						</Tooltip>
						<div styleName="button" onClick={this.handleClickPause}>
							{this.state.isPaused ? (
								<Play/>
							) : (
								<Pause/>
							)}
						</div>
						<Tooltip
							title="未実装"
							styleName="button unimplemented"
						>
							<StepForward/>
						</Tooltip>
					</div>
					<div styleName="title">
						♪{this.song.title}／{this.song.artist}
						<Tooltip
							title="未実装"
							distance={-30}
							styleName="change unimplemented"
						>
							<Refresh/> かえる
						</Tooltip>
					</div>
					<div styleName="button" onClick={this.handleClickDefault}>
						<Tooltip
							title="デフォルトに戻す"
							style={{width: '100%', height: '100%'}}
						>
							<Undo/>
						</Tooltip>
					</div>
					<div styleName={classNames('play-video', {active: !this.state.isNoVideo})} onClick={this.handleChangeCheckbox}>
						<Tooltip
							title={this.state.isNoVideo ? '動画再生をONにする' : '動画再生をOFFにする'}
							style={{width: '100%', height: '100%'}}
						>
							{this.state.isNoVideo ? (
								<React.Fragment>
									<VideocamOff/> 動画OFF
								</React.Fragment>
							) : (
								<React.Fragment>
									<Videocam/> 動画ON
								</React.Fragment>
							)}
						</Tooltip>
					</div>
					<a styleName="github button" href="https://github.com/hakatashi/iwashi" rel="noopener noreferrer" target="_blank">
						<Tooltip
							title="Fork me on GitHub!"
							style={{width: '100%', height: '100%'}}
						>
							<Github/>
						</Tooltip>
					</a>
				</div>
			</div>
		);
	}
};
