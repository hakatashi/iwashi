const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const {default: Hammer} = require('react-hammerjs');

import './VolumeControls.pcss';
import {MdVolumeOff, MdVolumeUp} from 'react-icons/md';

module.exports = class Track extends React.Component {
	static propTypes = {
		volume: PropTypes.number.isRequired,
		isMuted: PropTypes.bool.isRequired,
		isSolo: PropTypes.bool.isRequired,
		onChangeVolume: PropTypes.func.isRequired,
		onChangeMuted: PropTypes.func.isRequired,
		onChangeSolo: PropTypes.func.isRequired,
	};

	constructor(props, state) {
		super(props, state);

		this.state = {
			isMuted: this.props.isMuted,
			isSolo: this.props.isSolo,
		};

		this.previousVolume = this.props.volume;
	}

	componentWillReceiveProps(nextProps) {
		if (this.props.isMuted !== nextProps.isMuted) {
			this.setState({
				isMuted: nextProps.isMuted,
			});
		}

		if (this.props.isSolo !== nextProps.isSolo) {
			this.setState({
				isSolo: nextProps.isSolo,
			});
		}
	}

	handleClickMute = () => {
		this.setState(({isMuted}) => {
			const newIsMuted = !isMuted;

			this.props.onChangeMuted(newIsMuted);
			return {isMuted: newIsMuted};
		});
	};

	handleClickSolo = () => {
		this.setState(({isSolo}) => {
			const newIsSolo = !isSolo;

			this.props.onChangeSolo(newIsSolo);
			return {isSolo: newIsSolo};
		});
	};

	handleKnobPan = (event) => {
		const newVolume = Math.max(
			0,
			Math.min(this.previousVolume + event.deltaX / 100, 1)
		);
		this.props.onChangeVolume(newVolume);

		if (event.isFinal) {
			this.previousVolume = newVolume;
		}
	};

	render() {
		return (
			<div styleName="controls">
				<div styleName="mute" onClick={this.handleClickMute}>
					{this.state.isMuted ? <MdVolumeOff/> : <MdVolumeUp/>}
				</div>
				<div styleName="volume">
					{(() => {
						const height = 15;
						const width = 100;

						return (
							<svg width={width + height} height={height}>
								<rect
									styleName="volume-back"
									x="0"
									y="0"
									width={width + height}
									height={height}
									rx={height / 2}
									ry={height / 2}
								/>
								<rect
									styleName="volume-color"
									x="0"
									y="0"
									width={height + width * this.props.volume}
									height={height}
									rx={height / 2}
									ry={height / 2}
								/>
								<Hammer onPan={this.handleKnobPan}>
									<circle
										styleName="volume-knob"
										cx={height / 2 + width * this.props.volume}
										cy={height / 2}
										r={height * 0.5}
									/>
								</Hammer>
							</svg>
						);
					})()}
				</div>
				<div
					styleName={classNames('solo', {active: this.state.isSolo})}
					onClick={this.handleClickSolo}
				>
					SOLO
				</div>
			</div>
		);
	}
};
