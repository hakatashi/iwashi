const webpack = require('webpack');

module.exports = (env = {}) => ({
	entry: './index.babel.js',
	output: {
		path: __dirname,
		filename: 'index.js',
	},
	devtool: env.production ? 'source-map' : 'cheap-module-eval-source-map',
	module: {
		rules: [{
			test: /\.jsx?$/,
			exclude: /node_modules/,
			use: {
				loader: 'babel-loader',
				options: {
					presets: [
						['env', {
							targets: {
								browsers: [
									'last 2 chrome versions',
								],
							},
							useBuiltIns: 'entry',
							debug: true,
						}],
						'react',
					],
					plugins: [
						'transform-class-properties',
					],
				},
			},
		}, {
			test: /\.pcss$/,
			exclude: /node_modules/,
			use: [
				'style-loader',
				{loader: 'css-loader', options: {importLoaders: 1}},
				'postcss-loader',
			],
		}, {
			test: /\.ttf$/,
			use: [
				{
					loader: 'url-loader',
					options: {
						limit: Infinity,
						mimetype: 'application/font-woff',
					},
				},
				{
					loader: './lib/fontmin-loader.js',
					options: {
						text: '動画を再生する (激重)',
					},
				},
			],
		}, {
			test: /\.txt$/,
			exclude: /node_modules/,
			use: ['json-loader', './lib/mml-loader.js'],
		}],
	},
	node: {
		fs: 'empty',
		net: 'empty',
		tls: 'empty',
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(env.production ? 'production' : 'development'),
		}),
	],
});
