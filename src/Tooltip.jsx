const React = require('react');
const PropTypes = require('prop-types');
const {Tooltip: Tippy} = require('react-tippy');

require('./Tooltip.css');

const Tooltip = (props) => (
	<Tippy {...props} style={{display: '', ...props.style}}>
		{props.children}
	</Tippy>
);

Tooltip.propTypes = {
	children: PropTypes.arrayOf(PropTypes.element.isRequired).isRequired,
	// eslint-disable-next-line react/forbid-prop-types
	style: PropTypes.object,
	duration: PropTypes.number,
};

Tooltip.defaultProps = {
	style: {},
	duration: 100,
};

module.exports = Tooltip;
