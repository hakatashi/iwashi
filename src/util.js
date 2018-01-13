module.exports.getSoundUrls = (id) => (
	process.env.NODE_ENV === 'production' ? [
		`https://media.githubusercontent.com/media/hakatashi/iwashi/gh-pages/sound/${id}.ogg`,
		`https://media.githubusercontent.com/media/hakatashi/iwashi/gh-pages/sound/${id}.wav`,
	] : [
		`sound/${id}.ogg`,
		`sound/${id}.wav`,
	]
);

module.exports.getResourceUrl = (path) => (
	process.env.NODE_ENV === 'production'
		? `https://media.githubusercontent.com/media/hakatashi/iwashi/gh-pages/${path}`
		: path

);

module.exports.Deferred = class Deferred {
	constructor() {
		this.promise = new Promise((resolve, reject) => {
			this.nativeReject = reject;
			this.nativeResolve = resolve;
		});

		this.isResolved = false;
		this.isRejected = false;
	}

	resolve(...args) {
		this.nativeResolve(...args);
		this.isResolved = true;
	}

	reject(...args) {
		this.nativeReject(...args);
		this.isReject = true;
	}
};

module.exports.wait = (time) => (
	new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, time);
	})
);
