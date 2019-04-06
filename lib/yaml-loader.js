// So ugly... (;O;)

const yaml = require('js-yaml');

module.exports = (yamlText) => {
	const key = Array(100)
		.fill()
		.map(() => String.fromCodePoint(0x61 + Math.floor(Math.random() * 26)))
		.join('');

	const RequireYamlType = new yaml.Type('!require', {
		kind: 'scalar',
		construct: (path) => {
			const newPath = path || '';
			return `#${key}#${newPath}#${key}#`;
		},
	});

	const YAML_SCHEMA = yaml.Schema.create([RequireYamlType]);

	const data = yaml.load(yamlText, {schema: YAML_SCHEMA});
	const json = JSON.stringify(data);

	return `module.exports = ${json.replace(
		new RegExp(`"#${key}#(.+?)#${key}#"`, 'g'),
		'require("$1").default'
	)}`;
};
