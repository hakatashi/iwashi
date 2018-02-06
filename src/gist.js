const assert = require('assert');

module.exports.post = async ({description, filename, content}) => {
	const response = await fetch('https://api.github.com/gists', {
		mode: 'cors',
		method: 'POST',
		body: JSON.stringify({
			description,
			public: true,
			files: {
				[filename]: {
					content: JSON.stringify(content, null, '  '),
				},
			},
		}),
	});

	const data = await response.json();

	return data.id;
};

module.exports.load = async (id) => {
	assert(id.match(/^[\da-f]{20,}$/));

	const response = await fetch(`https://api.github.com/gists/${id}`, {
		mode: 'cors',
		method: 'GET',
	});

	const data = await response.json();

	if (!data.files) {
		return null;
	}

	const file = Object.values(data.files)[0];
	if (!file) {
		return null;
	}

	try {
		return JSON.parse(file.content);
	} catch (e) {
		return null;
	}
};
