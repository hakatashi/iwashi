const React = require('react');
const shuffle = require('lodash/shuffle');
const Music = require('react-icons/lib/fa/Music');
const Videocam = require('react-icons/lib/md/videocam');
const VideocamOff = require('react-icons/lib/md/videocam-off');
const Refresh = require('react-icons/lib/fa/refresh');

const Track = require('./Track.jsx');
const {TICK} = require('./const.js');
const VoiceManager = require('./VoiceManager.js');
const {getResourceUrl} = require('./util.js');

import './App.pcss';

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {
			beat: null,
			isNoVideo: true,
			isReady: false,
		};

		this.readySounds = new Set();

		this.voiceManagerPromise = VoiceManager.initialize([
			{
				source: 'vocal/yufu/01',
				start: 122,
				end: 370,
			},
			{
				source: 'vocal/yufu/02',
				start: 370,
				end: 626,
			},
			{
				source: 'vocal/yufu/03',
				start: 626,
				end: 882,
			},
			{
				source: 'vocal/yufu/04',
				start: 882,
				end: 1104,
			},
			{
				source: 'vocal/yufu/05',
				start: 1106,
				end: 1408,
			},
			{
				source: 'vocal/yufu/06',
				start: 1410,
				end: 1504,
			},
			{
				source: 'vocal/yufu/07',
				start: 1530,
				end: 1786,
			},
			{
				source: 'vocal/yufu/02',
				start: 1778,
				end: 2034,
			},
			{
				source: 'vocal/yufu/03',
				start: 2034,
				end: 2290,
			},
			{
				source: 'vocal/yufu/02',
				start: 2290,
				end: 2546,
			},
			{
				source: 'vocal/yufu/03',
				start: 2546,
				end: 2802,
			},
			{
				source: 'vocal/yufu/08',
				start: 2802,
				end: 2930,
			},
		]);

		const tracks = [
			{
				type: 'percussion',
				src: 'kinmoza-clap',
				url: 'https://www.youtube.com/watch?v=STcc8H4Vr_g',
				score: 'clap',
				videoStart: 5.4,
				videoDuration: 3,
				volume: 1,
			},
			{
				type: 'percussion',
				src: 'karateka-kick',
				url: 'https://www.youtube.com/watch?v=Cg6dlPZt-1g',
				score: 'snare',
				videoStart: 32,
				videoDuration: 0.3,
				volume: 0.5,
			},
			{
				type: 'percussion',
				src: 'killme-pyonsuke',
				url: 'https://www.youtube.com/watch?v=vXBO_W5l6uY',
				score: 'bass',
				videoStart: 247.7,
				videoDuration: 0.5,
				volume: 1,
			},
			{
				type: 'percussion',
				src: 'ippon-crisp',
				url: 'https://www.youtube.com/watch?v=2rc8CmeKinc',
				score: 'closed-hihat',
				videoStart: 23.7,
				videoDuration: 1,
				volume: 0.5,
			},
			{
				type: 'instrument',
				src: 'atsumori',
				url: 'https://www.youtube.com/watch?v=uvg3I_IR9FA',
				score: 'base',
				videoStart: 4.8,
				videoDuration: 0.5,
				volume: 0.3,
				sourceNote: 22,
				prank: true,
			},
			{
				type: 'chord',
				src: 'aoba-zoi',
				url: 'https://www.youtube.com/watch?v=DmZo4rL2E7E',
				score: 'chord',
				videoStart: 18.9,
				videoDuration: 2,
				volume: 0.2,
				sourceNote: 62,
			},
			{
				type: 'percussion',
				src: 'zen-glass',
				url: 'https://www.youtube.com/watch?v=M_1UZlPBYzM',
				score: 'bongo',
				videoStart: 24.5,
				videoDuration: 0.5,
				volume: 1,
			},
			{
				type: 'percussion',
				src: 'minecraft-blaze',
				url: 'https://www.youtube.com/watch?v=tKt0oImbQ_Y',
				score: 'chime1',
				videoStart: 500.5,
				videoDuration: 1,
				volume: 0.5,
			},
			{
				type: 'percussion',
				src: 'fireball-ring',
				url: 'https://www.youtube.com/watch?v=6CQymHcBwWQ',
				score: 'chime2',
				videoStart: 477.5,
				videoDuration: 3,
				volume: 0.5,
			},
			{
				type: 'instrument',
				src: 'ai-virus',
				url: 'https://www.youtube.com/watch?v=4v3F3luBMEM',
				score: 'chorus1',
				videoStart: 30.5,
				videoDuration: 3,
				volume: 0.2,
				sourceNote: 53,
			},
			{
				type: 'instrument',
				src: 'inazuma-pan',
				url: 'https://www.youtube.com/watch?v=l3JuhAwx5aY',
				score: 'chorus2',
				videoStart: 18,
				videoDuration: 1,
				volume: 0.4,
				sourceNote: 64,
			},
			{
				type: 'percussion',
				src: 'killme-cymbal',
				url: 'https://www.youtube.com/watch?v=Vv-SCTaw07w',
				score: 'cymbal',
				videoStart: 36.2,
				videoDuration: 5,
				volume: 0.2,
			},
			{
				type: 'instrument',
				src: 'oreo-oh',
				url: 'https://www.youtube.com/watch?v=lnpXXafCzj8',
				score: 'chorus3',
				videoStart: 10.7,
				videoDuration: 1,
				volume: 0.3,
				sourceNote: 62,
			},
			{
				type: 'instrument',
				src: 'zkai-eh',
				url: 'https://www.youtube.com/watch?v=e9ohRtZcOuo',
				score: 'chorus4',
				videoStart: 38.3,
				videoDuration: 1,
				volume: 0.4,
				sourceNote: 66,
			},
			{
				type: 'instrument',
				src: 'washing-aegi',
				url: 'https://www.youtube.com/watch?v=w5xP4zHSQYI',
				score: 'synth1',
				videoStart: 10,
				videoDuration: 1,
				volume: 0.3,
				sourceNote: 69,
				prank: true,
			},
			{
				type: 'instrument',
				src: 'kemofure-toki',
				url: 'https://www.youtube.com/watch?v=xOE6qlXqw7s',
				score: 'synth2',
				videoStart: 24,
				videoDuration: 1,
				volume: 0.2,
				sourceNote: 97,
				prank: true,
			},
			{
				type: 'instrument',
				src: 'chargeman-hai',
				url: 'https://www.youtube.com/watch?v=Ih9uYOlrPpQ',
				score: 'chorus5',
				videoStart: 179,
				videoDuration: 1,
				volume: 0.25,
				sourceNote: 59,
				prank: true,
			},
			{
				type: 'instrument',
				src: 'deremasu-suimasen',
				url: 'https://www.youtube.com/watch?v=7m7Wt75-js0',
				score: 'chorus6',
				videoStart: 4,
				videoDuration: 1,
				volume: 0.4,
				sourceNote: 56,
				prank: true,
			},
			{
				type: 'rap',
				src: 'bemybaby-intro',
				url: 'https://www.youtube.com/watch?v=jGWFDZ33UCU',
				videoStart: 5.3,
				videoDuration: 30,
				volume: 0.01,
				sourceRate: 1,
				rapSpeed: 127,
				rapFrom: 2304,
				rapTo: 2816,
				rapDuration: 4,
			},
		];

		this.tracks = shuffle(tracks);
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat === null ? TICK * 0 : this.state.beat + TICK});

		const beat = Math.floor(this.state.beat / TICK) % 2944;
		this.voiceManager.handleBeat(beat);
	}

	handleSoundReady = (score) => {
		this.readySounds.add(score);
		if (this.readySounds.size === this.tracks.length) {
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

	render() {
		return (
			<div styleName="app">
				<div styleName="main">
					<div styleName="tracks">
						{this.tracks.map((track) => (
							<Track
								key={track.src}
								src={track.src}
								url={track.url}
								score={track.type === 'rap' ? 'rap' : track.score}
								videoStart={track.videoStart}
								videoDuration={track.videoDuration}
								beat={this.state.beat}
								volume={track.volume}
								sourceNote={track.sourceNote}
								sourceRate={track.sourceRate}
								rapSpeed={track.rapSpeed}
								rapFrom={track.rapFrom}
								rapTo={track.rapTo}
								rapDuration={track.rapDuration}
								onReady={this.handleSoundReady}
								isNoVideo={this.state.isReady && this.state.isNoVideo}
								isPrank={Boolean(track.isPrank)}
								isPercussion={track.type === 'percussion'}
								isChord={track.type === 'chord'}
								isRap={track.type === 'rap'}
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
							{'なんねん　まえかの　ことでした'}
						</div>
					</div>
				</div>
				<div styleName="controls">
					<div styleName="title"><Music/> イワシがつちからはえてくるんだ</div>
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
