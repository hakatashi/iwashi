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

	const retFont = fonts.find((f) => f.extname === '.woff');

	callback(null, retFont ? retFont.contents : fonts[0].contents);
};

module.exports.raw = true;
