const React = require('react');
const ReactDOM = require('react-dom');
const App = require('./src/App.jsx');

require('babel-polyfill');

process.on('unhandledRejection', (error) => {
	throw error;
});

window.addEventListener('unhandledrejection', (error) => {
	throw error;
});

const reactRoot = document.getElementById('react');

ReactDOM.render(React.createElement(App), reactRoot);
