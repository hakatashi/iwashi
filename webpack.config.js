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
						['react-css-modules', {
							filetypes: {
								'.pcss': {
									syntax: 'postcss',
								},
							},
							handleMissingStyleName: 'warn',
							generateScopedName: '[name]__[local]--[hash:base64:5]',
						}],
						'transform-class-properties',
					],
				},
			},
		}, {
			test: /\.pcss$/,
			exclude: /node_modules/,
			use: [
				'style-loader',
				{
					loader: 'css-loader',
					options: {
						modules: true,
						importLoaders: 1,
						localIdentName: '[name]__[local]--[hash:base64:5]',
					},
				},
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
						text: [
							'♪',
							'イワシがつちからはえてくるんだ',
							'ころんば',
							'なんねん　まえかの　ことでした',
							'だれかが　ハサミで',
							'タイムラインを　ちょんぎった',
							'そして',
							'あしたと　きのうが　つながった',
							'あしたの　ことは　しっている',
							'イワシが　つちから　はえてくるんだ',
							'えきの　ホームに　あながあく',
							'すのこが　きえるんだ',
							'きのうの　きおくは　きえたけど',
							'きえたってことも　よくわからないんだ',
							'そらの　うえから　ビルがたつ',
							'めが　みえなくなってきた',
							'はな は かれず',
							'とり は とばず ねむる',
							'かぜ は とまり つめたく',
							'つき は みちも かけも せず まわる',
							'いままでと　これからが　つながって',
							'いちにちを　とばして　わすれて',
							'すすんでく',
							'ここは',
							'もとには　もどらなくなった',
							'動画再生',
							'かえる',
						].join(''),
					},
				},
			],
		}, {
			test: /\.txt$/,
			exclude: /node_modules/,
			use: ['json-loader', './lib/mml-loader.js'],
		}, {
			test: /\.yml$/,
			exclude: /node_modules/,
			use: ['./lib/yaml-loader.js'],
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
