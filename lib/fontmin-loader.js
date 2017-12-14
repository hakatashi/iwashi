const Fontmin = require('fontmin');
const loaderUtils = require('loader-utils');

module.exports = async function(font) {
	const callback = this.async();
	const fontmin = new Fontmin().src(font);
	const options = loaderUtils.getOptions(this) || {};

	if (options.text) {
		fontmin.use(Fontmin.glyph({
			text: options.text,
			hinting: false,
		}));
	}

	fontmin.use(Fontmin.ttf2woff());

	const fonts = await new Promise((resolve, reject) => {
		fontmin.run((error, files) => {
			if (error) {
				reject(error);
			} else {
				resolve(files);
			}
		});
	});

	callback(null, fonts[1].contents);
};

module.exports.raw = true;
