const assert = require('assert');
const qs = require('querystring');
const React = require('react');
const classNames = require('classnames');
const PropTypes = require('prop-types');
const shuffle = require('lodash/shuffle');
const get = require('lodash/get');
const Modernizr = require('modernizr');
// eslint-disable-next-line node/no-missing-require
const createjs = require('imports-loader?this=>window!exports-loader?window.createjs!preloadjs/lib/preloadjs');

import './App.pcss';
import {
	FaFacebook,
	FaGithub,
	FaPause,
	FaPlay,
	FaStepBackward,
	FaStepForward,
	FaTwitter,
} from 'react-icons/fa';
import {
	MdRefresh,
	MdShare,
	MdUndo,
	MdVideocam,
	MdVideocamOff,
} from 'react-icons/md';
// eslint-disable-next-line node/no-extraneous-require
const {default: Hatena} = require('hatena-icon/hatenabookmark-logomark.svg');

const {TICK} = require('./const.js');
const VocalManager = require('./VocalManager.js');
const {getResourceUrl, wait, isMobile, Deferred} = require('./util.js');
const songs = require('../songs/index.js');
const params = require('./params.js');
const gist = require('./gist.js');
const Track = require('./Track.jsx');
const Loading = require('./Loading.jsx');
const VolumeControls = require('./VolumeControls.jsx');
const SoundSelect = require('./SoundSelect.jsx');
const Tooltip = require('./Tooltip.jsx');

class ShareIcon extends React.Component {
	static propTypes = {
		name: PropTypes.oneOf(['twitter', 'hatena', 'facebook']).isRequired,
		isArrange: PropTypes.bool.isRequired,
		children: PropTypes.oneOfType([
			PropTypes.arrayOf(PropTypes.node),
			PropTypes.node,
		]).isRequired,
		onClick: PropTypes.func.isRequired,
	};

	handleClick = (event) => {
		this.props.onClick(this.props.name, this.props.isArrange, event);
	};

	render() {
		return (
			<div
				styleName={classNames('share-icon', this.props.name)}
				onClick={this.handleClick}
			>
				{this.props.children}
			</div>
		);
	}
}

module.exports = class App extends React.Component {
	static propTypes = {
		// eslint-disable-next-line react/forbid-prop-types
		gistData: PropTypes.any,
	};

	static defaultProps = {
		gistData: null,
	};

	constructor(props) {
		super(props);

		this.song = songs.iwashi;

		this.vocalManagerPromise = VocalManager.initialize(
			this.song.vocals,
			this.song.defaultVocal
		);
		this.backgroundDeferred = new Deferred();

		this.tracks = shuffle(Object.entries(this.song.tracks));

		this.initBackground();

		this.selectedSound = null;
		this.isInitialized = false;
		this.clearedIntervals = new Set();

		const size = (() => {
			if (isMobile()) {
				return 'small';
			}

			if (window.innerWidth <= 1366) {
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
			trackSounds: new Map(
				this.tracks.map(([name, track]) => [
					name,
					{
						sound: String(
							get(
								this.props.gistData,
								['songs', 0, 'tracks', name, 'sound'],
								track.default.sound
							)
						),
						volume: Number(
							get(
								this.props.gistData,
								['songs', 0, 'tracks', name, 'volume'],
								track.default.volume
							)
						),
						muted: Boolean(
							get(
								this.props.gistData,
								['songs', 0, 'tracks', name, 'muted'],
								false
							)
						),
						solo: Boolean(
							get(
								this.props.gistData,
								['songs', 0, 'tracks', name, 'solo'],
								false
							)
						),
						pan: 0,
					},
				])
			),
			size,
			soundSelect: false,
			soundSelectTop: 0,
			soundSelectLeft: 0,
			vocalVolume: 0.6,
			background: this.song.backgrounds[0],
			backgroundAnimation: null,
			backgroundDuration: null,
			shareName: '',
			flashCount: 0,
			isFlashing: false,
			isNoVideo: true,
			isReady: false,
			isIntro: false,
			isPaused: false,
			isPlayReady: false,
			isVocalDisabled: false,
			isVocalSolo: false,
			isShareOpen: false,
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

	initBackground = () => {
		const queue = new createjs.LoadQueue();
		queue.loadManifest(
			this.song.backgrounds.map((b) => b.url).filter((url) => url !== null)
		);
		queue.addEventListener('fileload', () => {
			// Resolves when the first background image is preloaded
			if (!this.backgroundDeferred.isResolved) {
				this.backgroundDeferred.resolve();
			}
		});
	};

	pause = () => {
		if (this.state.isPaused) {
			return;
		}
		clearInterval(this.handleBeatInterval);
		this.clearedIntervals.add(this.handleBeatInterval);
		this.vocalManager.pause();
		this.setState({isPaused: true});
	};

	unpause = () => {
		if (!this.state.isPaused) {
			return;
		}
		if (this.clearedIntervals.has(this.handleBeatInterval)) {
			this.handleBeatInterval = setInterval(this.handleBeat, TICK * 1000);
		}
		this.vocalManager.unpause();
		this.setState({isPaused: false});
	};

	handleBeat = () => {
		this.setState(({beat}) => ({beat: beat === null ? TICK * 0 : beat + TICK}));

		const beat = Math.floor(this.state.beat / TICK) % 2944;
		this.vocalManager.onBeat(beat);

		const lyric = this.song.lyrics.find(
			({start, end}) => start <= beat && beat < end
		);
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
						this.setState(
							{
								background,
								backgroundAnimation: null,
								backgroundDuration:
									nextBackground &&
									((((nextBackground.time - background.time) /
										this.song.resolution) *
										4) /
										this.song.bpm) *
										60,
							},
							resolve
						);
					})
						.then(() => wait(0))
						.then(() => {
							// this.setState({backgroundAnimation: background.animation});
						});
					break;
				}
			}
		}
	};

	handleSoundStatusChanged = async (name, status) => {
		this.setState(({trackStatuses}) => ({
			trackStatuses: trackStatuses.set(name, status),
		}));

		if (
			this.state.soundSelect === false &&
			Array.from(this.state.trackStatuses.values()).every((s) => s === 'ready')
		) {
			if (this.isInitialized) {
				this.unpause();
			} else {
				this.isInitialized = true;

				const [vocalManager] = await Promise.all([
					this.vocalManagerPromise,
					this.backgroundDeferred.promise,
				]);

				this.vocalManager = vocalManager;

				if (!params.debug) {
					await wait(1000);
				}

				this.setState({
					isReady: true,
					isIntro: true,
				});

				if (params.debug) {
					this.handleIntroEnded();
				}
			}
		}
	};

	handleChangeCheckbox = () => {
		this.setState(({isNoVideo}) => ({isNoVideo: !isNoVideo}));
	};

	handleFlash = async () => {
		if (isMobile()) {
			return;
		}

		await new Promise((resolve) => {
			this.setState(
				({flashCount}) => ({
					isFlashing: false,
					flashCount: flashCount + 1,
				}),
				resolve
			);
		});

		await wait(0);

		this.setState({
			isFlashing: true,
			isIntro: false,
		});
	};

	handleChangeSolo = (score, isSolo) => {
		if (isSolo) {
			this.vocalManager.enableNotSolo();
		} else {
			this.vocalManager.disableNotSolo();
		}

		this.setState({
			soloScore: isSolo ? score : null,
			isVocalDisabled: this.vocalManager.isNotSolo || this.vocalManager.isMuted,
			...(isSolo ? {isVocalSolo: false} : {}),
		});
	};

	handleChangeVoiceMuted = (isMuted) => {
		if (isMuted) {
			this.vocalManager.mute();
		} else {
			this.vocalManager.unmute();
		}

		this.setState({
			isVocalDisabled: this.vocalManager.isNotSolo || this.vocalManager.isMuted,
		});
	};

	handleChangeVoiceVolume = (volume) => {
		this.vocalManager.setVolume(volume);
		this.setState({
			vocalVolume: this.vocalManager.volume,
		});
	};

	handleChangeVoiceSolo = (isSolo) => {
		if (isSolo && this.state.isVocalDisabled) {
			this.vocalManager.unmute();
			this.vocalManager.disableNotSolo();
		}

		this.setState({
			isVocalSolo: isSolo,
			...(isSolo
				? {
					isVocalDisabled: false,
					soloScore: null,
				  }
				: {}),
		});
	};

	handleClickPause = () => {
		if (this.state.isPaused) {
			this.unpause();
		} else {
			this.pause();
		}
	};

	handleClickChange = (name, target) => {
		this.selectedSound = this.state.trackSounds.get(name).sound;
		this.setState({
			soundSelect: name,
			soundSelectTop: target.offsetTop + target.offsetHeight / 2,
			soundSelectLeft: target.offsetLeft + target.offsetWidth / 2,
		});
		this.pause();
	};

	handleClickBackdrop = () => {
		const selectedTrack = this.state.soundSelect;

		this.setState({soundSelect: false});

		if (
			this.selectedSound === this.state.trackSounds.get(selectedTrack).sound
		) {
			if (
				Array.from(this.state.trackStatuses.values()).every(
					(s) => s === 'ready'
				)
			) {
				this.unpause();
			}
		} else {
			this.setState(({trackSounds}) => ({
				trackSounds: trackSounds.set(selectedTrack, {
					...trackSounds.get(selectedTrack),
					sound: this.selectedSound,
				}),
			}));
		}
	};

	handleSoundSelect = (name) => {
		this.selectedSound = name;
	};

	handleClickOk = () => {
		this.setState({isPlayReady: true});
	};

	handleClickDefault = () => {
		this.setState({
			trackSounds: new Map(
				this.tracks.map(([name, track]) => [
					name,
					{
						sound: track.default.sound,
						volume: track.default.volume,
						muted: false,
						solo: false,
						pan: 0,
					},
				])
			),
		});
		this.pause();
	};

	handleUpdateTrack = (name, track) => {
		this.setState(({trackSounds}) => ({
			trackSounds: trackSounds.set(name, track),
		}));
	};

	handleIntroEnded = () => {
		assert(this.state.isIntro === true);
		this.handleBeatInterval = setInterval(this.handleBeat, TICK * 1000);
	};

	handleClickShare = () => {
		this.setState(({isShareOpen}) => ({isShareOpen: !isShareOpen}));
	};

	handleRequestCloseShare = () => {
		this.setState({isShareOpen: false});
	};

	handleShareNameChange = (event) => {
		this.setState({shareName: event.target.value});
	};

	handleClickShareIcon = async (name, isArrange) => {
		const path = await (async () => {
			if (isArrange === false) {
				return '/';
			}

			const content = {
				version: 1,
				transcriber: this.state.shareName,
				songs: [
					{
						song: 'iwashi',
						vocal: {
							sound: 'yufu',
							volume: 1,
							muted: false,
							solo: false,
							pan: 0,
						},
						tracks: Object.assign(
							...Array.from(this.state.trackSounds).map(([track, value]) => ({
								[track]: value,
							}))
						),
						jingles: [],
					},
				],
			};

			const gistId = await gist.post({
				description:
					'音MAD自動演奏サイト「iwashi」アレンジデータ #iwashi https://hakatashi.github.io/iwashi/',
				filename: 'iwashi-score.json',
				content,
			});

			return `/?gist=${gistId}`;
		})();

		const url = `https://hakatashi.github.io/iwashi${path}`;

		const titleText = (() => {
			if (isArrange) {
				if (this.state.shareName) {
					return `${this.state.shareName}さんが「${
						this.song.title
					}」をアレンジしました！`;
				}

				return `「${this.song.title}」をアレンジしました！`;
			}

			return '';
		})();

		const title = titleText ? `${titleText} ${document.title}` : document.title;

		const intent = (() => {
			if (name === 'twitter') {
				return `https://twitter.com/intent/tweet?${qs.encode({
					text: title,
					url,
					hashtags: 'iwashi',
				})}`;
			}

			if (name === 'facebook') {
				return `https://www.facebook.com/sharer/sharer.php?${qs.encode({
					u: url,
				})}`;
			}

			assert(name === 'hatena');
			return `http://b.hatena.ne.jp/add?${qs.encode({
				mode: 'confirm',
				url,
				title,
			})}`;
		})();

		open(intent, 'share', 'width=600,height=400');

		if (isArrange) {
			history.replaceState(null, null, path);
		}
	};

	render() {
		return (
			<div
				styleName={classNames('app', {
					flash: this.state.isFlashing,
					intro: this.state.isIntro,
				})}
			>
				<Loading
					titleComponents={this.song.titleComponents}
					transcriber={
						this.props.gistData
							? String(get(this.props.gistData, 'transcriber', '名無し'))
							: null
					}
					statuses={this.tracks.map(([name]) => this.state.trackStatuses.get(name))}
					name="iwashi"
					vanishing={this.state.isReady}
					isPlayReady={this.state.isPlayReady}
					onClickOk={this.handleClickOk}
				/>
				<div styleName="main">
					<div
						styleName={classNames(
							'background',
							this.state.backgroundAnimation,
							{paused: this.state.isPaused}
						)}
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
									flashCount={this.state.flashCount}
									onFlash={this.handleFlash}
									onChangeSolo={this.handleChangeSolo}
									onChangeStatus={this.handleSoundStatusChanged}
									onClickChange={this.handleClickChange}
									onUpdate={this.handleUpdateTrack}
									onIntroEnded={this.handleIntroEnded}
									isReady={this.state.isReady}
									isIntro={this.state.isIntro}
									isPaused={this.state.isPaused}
									isNoVideo={this.state.isNoVideo}
									isNotSolo={
										this.state.isVocalSolo ||
										(this.state.soloScore !== null &&
											this.state.soloScore !== name)
									}
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
									sound={
										this.state.trackSounds.get(this.state.soundSelect).sound
									}
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
								<MdRefresh/> かえる
							</Tooltip>
						</div>
						<div styleName="lyric-text">{this.state.lyric}</div>
						<div styleName="lyric-controls">
							<VolumeControls
								volume={this.state.vocalVolume}
								isMuted={this.vocalManager && this.vocalManager.isMuted}
								isSolo={this.state.isVocalSolo}
								onChangeMuted={this.handleChangeVoiceMuted}
								onChangeVolume={this.handleChangeVoiceVolume}
								onChangeSolo={this.handleChangeVoiceSolo}
							/>
						</div>
						{this.state.background.author && (
							<div styleName="background-info">
								背景:{' '}
								<a
									href={this.state.background.workUrl}
									rel="noopener noreferrer"
									target="_blank"
								>
									{this.state.background.title}
								</a>{' '}
								by {this.state.background.author}
							</div>
						)}
					</div>
				</div>
				<div styleName="controls">
					<div styleName="playback">
						<Tooltip title="未実装" styleName="button unimplemented">
							<FaStepBackward/>
						</Tooltip>
						<div styleName="button" onClick={this.handleClickPause}>
							{this.state.isPaused ? <FaPlay/> : <FaPause/>}
						</div>
						<Tooltip title="未実装" styleName="button unimplemented">
							<FaStepForward/>
						</Tooltip>
					</div>
					<div styleName="title">
						♪{this.song.title}／{this.song.artist}
						<Tooltip
							title="未実装"
							distance={-30}
							styleName="change unimplemented"
						>
							<MdRefresh/> かえる
						</Tooltip>
					</div>
					<div styleName="button" onClick={this.handleClickShare}>
						<Tooltip
							html={
								<div styleName="share">
									<div styleName="head">
										この<strong>サイト</strong>をシェアする
									</div>
									<div styleName="share-icons">
										<ShareIcon
											name="twitter"
											isArrange={false}
											onClick={this.handleClickShareIcon}
										>
											<FaTwitter/>
										</ShareIcon>
										<ShareIcon
											name="facebook"
											isArrange={false}
											onClick={this.handleClickShareIcon}
										>
											<FaFacebook/>
										</ShareIcon>
										<ShareIcon
											name="hatena"
											isArrange={false}
											onClick={this.handleClickShareIcon}
										>
											<Hatena/>
										</ShareIcon>
									</div>
									<div styleName="head">
										この<strong>アレンジ</strong>をシェアする
									</div>
									<div styleName="share-name">
										{'「'}
										<input
											type="text"
											value={this.state.shareName}
											placeholder="名無し"
											onChange={this.handleShareNameChange}
										/>
										{'さんによるアレンジ」'}
									</div>
									<div styleName="share-icons">
										<ShareIcon
											name="twitter"
											isArrange
											onClick={this.handleClickShareIcon}
										>
											<FaTwitter/>
										</ShareIcon>
										<ShareIcon
											name="facebook"
											isArrange
											onClick={this.handleClickShareIcon}
										>
											<FaFacebook/>
										</ShareIcon>
									</div>
								</div>
							}
							interaction
							interactive
							open={this.state.isShareOpen}
							style={{width: '100%', height: '100%'}}
							onRequestClose={this.handleRequestCloseShare}
							arrow
							animateFill={false}
						>
							<MdShare/>
						</Tooltip>
					</div>
					<div styleName="button" onClick={this.handleClickDefault}>
						<Tooltip
							title="デフォルトに戻す"
							style={{width: '100%', height: '100%'}}
						>
							<MdUndo/>
						</Tooltip>
					</div>
					<div
						styleName={classNames('play-video', {
							active: !this.state.isNoVideo,
						})}
						onClick={this.handleChangeCheckbox}
					>
						<Tooltip
							title={
								this.state.isNoVideo
									? '動画再生をONにする'
									: '動画再生をOFFにする'
							}
							style={{width: '100%', height: '100%'}}
						>
							{this.state.isNoVideo ? <MdVideocamOff/> : <MdVideocam/>}
						</Tooltip>
					</div>
					<a
						styleName="github button"
						href="https://github.com/hakatashi/iwashi"
						rel="noopener noreferrer"
						target="_blank"
					>
						<Tooltip
							title="Fork me on GitHub!"
							style={{width: '100%', height: '100%'}}
						>
							<FaGithub/>
						</Tooltip>
					</a>
				</div>
			</div>
		);
	}
};
