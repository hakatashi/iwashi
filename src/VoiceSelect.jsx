/* eslint-disable no-implicit-coercion */

const React = require('react');
const PropTypes = require('prop-types');

import './VoiceSelect.pcss';

module.exports = class VoiceSelect extends React.Component {
	static propTypes = {
		top: PropTypes.number.isRequired,
		left: PropTypes.number.isRequired,
	}

	constructor(props, state) {
		super(props, state);
		this.state = {
		};
	}

	render() {
		return (
			<div
				styleName="voice-select"
				style={{
					top: this.props.top,
					left: this.props.left,
				}}
			/>
		);
	}
};
