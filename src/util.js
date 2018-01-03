module.exports.getSoundUrls = (id) => (
	process.env.NODE_ENV === 'production' ? [
		`https://media.githubusercontent.com/media/hakatashi/iwashi/gh-pages/sound/${id}.ogg`,
		`https://media.githubusercontent.com/media/hakatashi/iwashi/gh-pages/sound/${id}.wav`,
	] : [
		`sound/${id}.ogg`,
		`sound/${id}.wav`,
	]
);

module.exports.Deferred = class Deferred {
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.reject = reject;
			this.resolve = resolve;
		});
	}
};
