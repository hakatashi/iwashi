const React = require('react');
const {Howl} = require('howler');
const shuffle = require('lodash/shuffle');

const Sound = require('./Sound.jsx');
const {TICK} = require('./const.js');
const {getSoundUrls} = require('./util.js');

require('./App.pcss');

module.exports = class App extends React.Component {
	constructor() {
		super();

		this.state = {
			beat: null,
			isNoVideo: true,
			isReady: false,
		};

		this.readySounds = new Set();

		this.vocalData = [
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
		];

		this.vocalSounds = new Map();

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
				volume: 0.3,
				sourceRate: 1,
				rapSpeed: 127,
				rapFrom: 2304,
				rapTo: 2816,
				rapDuration: 4,
			},
		];

		this.tracks = shuffle(tracks);
	}

	preloadVocal = (source) => {
		if (this.vocalSounds.has(source)) {
			return;
		}

		const howl = new Howl({
			src: getSoundUrls(source),
			volume: 1.3,
		});

		this.vocalSounds.set(source, howl);
	}

	handleBeat = () => {
		this.setState({beat: this.state.beat === null ? TICK * 2688 : this.state.beat + TICK});

		for (const {source, start, end} of this.vocalData) {
			if (Math.abs(this.state.beat % (TICK * 2944) - TICK * (start - 64)) < TICK / 2) {
				this.preloadVocal(source);
			}

			if (Math.abs(this.state.beat % (TICK * 2944) - TICK * start) < TICK / 2) {
				this.vocalSounds.get(source).stop();
				this.vocalSounds.get(source).seek(0);
				this.vocalSounds.get(source).play();
			}

			if (Math.floor(this.state.beat / TICK) % 16 === 0 && TICK * start <= this.state.beat % (TICK * 2944) && this.state.beat % (TICK * 2944) <= TICK * end) {
				const playbackTime = this.vocalSounds.get(source).seek();
				if (Math.abs((playbackTime + TICK * start) - this.state.beat % (TICK * 2944)) > TICK * 2) {
					this.vocalSounds.get(source).seek(this.state.beat % (TICK * 2944) - TICK * start);
				}
			}
		}
	}

	handleSoundReady = (score) => {
		this.readySounds.add(score);
		if (this.readySounds.size === this.tracks.length) {
			this.setState({isReady: true});
			setInterval(this.handleBeat, TICK * 1000);
		}
	}

	handleChangeCheckbox = () => {
		this.setState({isNoVideo: !this.state.isNoVideo});
	}

	render() {
		return (
			<div>
				<input type="checkbox" checked={!this.state.isNoVideo} onChange={this.handleChangeCheckbox}/> 動画を再生する (激重)
				<div>
					{this.tracks.map((track) => (
						<Sound
							key={track.src}
							src={track.src}
							url={track.url}
							score={track.score}
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
			</div>
		);
	}
};
