/* eslint-disable no-implicit-coercion */

const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');

const soundData = require('../sound/data.yml');

import './VoiceSelect.pcss';

module.exports = class VoiceSelect extends React.Component {
	static propTypes = {
		top: PropTypes.number.isRequired,
		left: PropTypes.number.isRequired,
		sound: PropTypes.string.isRequired,
		type: PropTypes.string.isRequired,
	}

	constructor(props, state) {
		super(props, state);

		this.direction = this.props.top > 400 ? 'top' : 'bottom';

		this.state = {
			selectedSound: this.props.sound,
		};
	}

	getThumbnailUrl = (url) => {
		let matches = null;

		matches = url.match(/^https?:\/\/www\.youtube\.com\/watch\?v=(.+)$/);
		if (matches) {
			return `https://i.ytimg.com/vi/${matches[1]}/1.jpg`;
		}

		return 'https://placehold.it/120x90';
	}

	render() {
		return (
			<div
				styleName={classNames('voice-select', this.direction)}
				style={{
					top: this.props.top,
					left: this.props.left,
				}}
			>
				<div styleName="content">
					<div styleName="sounds">
						{Object.entries(soundData).filter(([name, sound]) => {
							if (this.props.type === 'percussion') {
								return sound.type === 'percussion';
							}

							if (this.props.type === 'rap') {
								return sound.type === 'rap';
							}

							return sound.type === 'instrument';
						}).map(([name, sound]) => (
							<div key={name} styleName={classNames('sound', {active: this.state.selectedSound === name})}>
								<img styleName="thumbnail" src={this.getThumbnailUrl(sound.video.url)}/>
								<div styleName="description">
									<strong>{sound.resource.work}</strong>より<strong>{sound.resource.name}</strong>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}
};
