/* eslint-disable no-implicit-coercion */

const React = require('react');
const PropTypes = require('prop-types');
const oneLine = require('common-tags/lib/oneLine');
const {getResourceUrl} = require('./util.js');

import './Loading.pcss';

const Loading = (props) => (
	<div styleName="loading">
		<div styleName="inner">
			<img styleName="icon" src={getResourceUrl(`songs/${props.name}/icon.png`)}/>
			<div styleName="title">
				{
					props.titleComponents.map((component, index) => ([
						component,
						...(props.titleComponents.length - 1 === index ? [] : [<wbr key={index}/>]),
					]))
				}
			</div>
			<div styleName="artist">～原曲不使用音声による自動演奏～</div>
			<svg styleName="progress" viewBox="-50 -50 100 100">
				<circle cx="0" cy="0" r="7" fill="#FFC107"/>
				{Array(19).fill().map((_, index) => {
					const size = 5;
					const curve = 1.5;

					const translates = [
						[-1.5, -2],
						[-0.5, -2],
						[0.5, -2],
						[1.5, -2],

						[-1.5, -1],
						[-0.5, -1],
						[0.5, -1],
						[1.5, -1],

						[-2, 0],
						[-1, 0],
						// blank
						[1, 0],
						[2, 0],

						[-1.5, 1],
						[-0.5, 1],
						[0.5, 1],
						[1.5, 1],

						[-1, 2],
						[0, 2],
						[1, 2],
					];

					return (
						<path
							key={index}
							fill="#D50000"
							strokeWidth="4"
							transform={`translate(${translates[index][0] * size * 3.5}, ${translates[index][1] * size * 2.7}) scale(1.2, 1)`}
							d={oneLine`
								M ${-size} ${-size}
								Q 0 ${-size - curve} ${size} ${-size}
								Q ${size + curve} 0 ${size} ${size}
								Q 0 ${size + curve} ${-size} ${size}
								Q ${-size - curve} 0 ${-size} ${-size}
								Z
							`}
						/>
					);
				})}
			</svg>
		</div>
	</div>
);

Loading.propTypes = {
	titleComponents: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
	artist: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
};

module.exports = Loading;
