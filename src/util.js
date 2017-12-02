module.exports.getSoundUrl = (id) => (
	process.env.NODE_ENV === 'production' ? `https://media.githubusercontent.com/media/hakatashi/iwashi/master/sound/${id}.ogg` : `sound/${id}.ogg`
)
