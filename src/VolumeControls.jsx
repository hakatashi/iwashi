const qs = require('querystring');
const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const VolumeUp = require('react-icons/lib/md/volume-up');
const VolumeOff = require('react-icons/lib/md/volume-off');

import './VolumeControls.pcss';

module.exports = class Track extends React.Component {
	static propTypes = {
		volume: PropTypes.number.isRequired,
		isMuted: PropTypes.bool.isRequired,
		isSolo: PropTypes.bool.isRequired,
		onChangeMuted: PropTypes.func.isRequired,
		onChangeSolo: PropTypes.func.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.state = {
			isMuted: this.props.isMuted,
			isSolo: this.props.isSolo,
		};
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
		const newIsMuted = !this.state.isMuted;

		this.setState({isMuted: newIsMuted});
		this.props.onChangeMuted(newIsMuted);
	}

	handleClickSolo = () => {
		const newIsSolo = !this.state.isSolo;

		this.setState({isSolo: newIsSolo});
		this.props.onChangeSolo(newIsSolo);
	}

	render() {
		return (
			<div styleName="controls">
				<div styleName="mute" onClick={this.handleClickMute}>
					{this.state.isMuted ? (
						<VolumeOff/>
					) : (
						<VolumeUp/>
					)}
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
								<path
									styleName="volume-color"
									d={`
										M ${height / 2} ${height / 2}
										L ${width + height / 2} 0
										A ${height / 2} ${height / 2} 0 0 1 ${width + height / 2} ${height}
										Z
									`}
								/>
								<circle
									styleName="volume-pinch"
									cx={height / 2 + width * this.props.volume}
									cy={height / 2}
									r={height * 0.4}
								/>
							</svg>
						);
					})()}
				</div>
				<div styleName={classNames('solo', {active: this.state.isSolo})} onClick={this.handleClickSolo}>
					SOLO
				</div>
			</div>
		);
	}
};
