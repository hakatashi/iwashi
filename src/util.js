module.exports.getSoundUrls = (id) => (
	process.env.NODE_ENV === 'production' ? [
		`https://media.githubusercontent.com/media/hakatashi/iwashi/master/sound/${id}.ogg`,
		`https://media.githubusercontent.com/media/hakatashi/iwashi/master/sound/${id}.wav`,
	] : [
		`sound/${id}.ogg`,
		`sound/${id}.wav`,
	]
);
