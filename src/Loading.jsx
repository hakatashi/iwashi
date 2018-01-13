/* eslint-disable no-implicit-coercion */

const React = require('react');
const PropTypes = require('prop-types');
const classNames = require('classnames');
const sum = require('lodash/sum');
const {getResourceUrl} = require('./util.js');

import './Loading.pcss';

const R = 'right';
const L = 'left';

const progressPositions = [
	// [(R|L), x, y]
	[R, 0, 0],
	[L, 0, 0],
	[R, 0.5, 1],
	[L, 0.5, 1],
	[R, 1.8, 2],
	[L, 1.8, 2],
	[R, 1, 0],
	[L, 1, 0],
	[R, 1.5, 1],
	[L, 1.5, 1],
	[R, 2.8, 2],
	[L, 2.8, 2],
	[R, 2, 0],
	[L, 2, 0],
	[R, 2.5, 1],
	[L, 2.5, 1],
	[R, 3.8, 2],
	[L, 3.8, 2],
	[R, 4.8, 2],
	[L, 4.8, 2],
];

const width = 25;
const height = 20;
const margin = 10;

module.exports = class Loading extends React.Component {
	static propTypes = {
		titleComponents: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
		name: PropTypes.string.isRequired,
		statuses: PropTypes.arrayOf(PropTypes.oneOf(['loading', 'seeking', 'ready']).isRequired).isRequired,
		vanishing: PropTypes.bool.isRequired,
	}

	constructor(props, state) {
		super(props, state);
		this.state = {
			vanished: false,
		};
	}

	getProgress = () => (
		sum(this.props.statuses.map((status) => ({
			loading: 0,
			seeking: 1,
			ready: 2,
		}[status]))) / (this.props.statuses.length * 2)
	);

	handleRef = (root) => {
		this.root = root;
	}

	handleTransitionEnd = (event) => {
		if (event.target === this.root) {
			this.setState({vanished: true});
		}
	}

	render() {
		return !this.state.vanished && (
			<div
				styleName={classNames('loading', {vanishing: this.props.vanishing})}
				onTransitionEnd={this.handleTransitionEnd}
				ref={this.handleRef}
			>
				<div styleName="inner">
					<div styleName="progress-area">
						<svg styleName="progress left" viewBox={`0 0 200 ${(height + margin) * 3 - margin}`}>
							{this.props.statuses.map((status, index) => {
								const [rightOrLeft, x, y] = progressPositions[index];

								if (rightOrLeft !== L) {
									return null;
								}

								return (
									<rect
										key={index}
										x={200 - width}
										y={0}
										width={width}
										height={height}
										fill={{loading: 'white', seeking: 'yellow', ready: 'red'}[status]}
										style={{
											transition: 'fill 0.3s',
										}}
										transform={`translate(${-x * (width + margin)}, ${y * (height + margin)})`}
									/>
								);
							})}
						</svg>
						<img styleName="icon" src={getResourceUrl(`songs/${this.props.name}/icon.png`)}/>
						<svg styleName="progress right" viewBox={`0 0 200 ${(height + margin) * 3 - margin}`}>
							{this.props.statuses.map((status, index) => {
								const [rightOrLeft, x, y] = progressPositions[index];

								if (rightOrLeft !== R) {
									return null;
								}

								return (
									<rect
										key={index}
										transition="fill 0.3s"
										x={0}
										y={0}
										width={width}
										height={height}
										fill={{loading: 'white', seeking: 'yellow', ready: 'red'}[status]}
										style={{
											transition: 'fill 0.3s',
										}}
										transform={`translate(${x * (width + margin)}, ${y * (height + margin)})`}
									/>
								);
							})}
						</svg>
					</div>
					<div styleName="title">
						{
							this.props.titleComponents.map((component, index) => ([
								component,
								...(this.props.titleComponents.length - 1 === index ? [] : [<wbr key={index}/>]),
							]))
						}
					</div>
					<div styleName="artist">～原曲不使用音声による自動演奏～</div>
					<div styleName="loading-text">{Math.floor(this.getProgress() * 100)}% Loaded...</div>
				</div>
			</div>
		);
	}
};