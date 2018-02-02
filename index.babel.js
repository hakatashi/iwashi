const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./src/App.jsx');
const gist = require('./src/gist.js');
const params = require('./src/params.js');

require('react-tippy/dist/tippy.css');

require('babel-polyfill');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

(async () => {
	const gistData = await (() => {
		if (!params.gist || !params.gist.match(/^[\da-f]{20,}$/)) {
			return Promise.resolve(null);
		}

		return gist.load(params.gist);
	})();

	const reactRoot = document.getElementById('react');
	ReactDOM.render(React.createElement(App, {gistData}), reactRoot);
})();
