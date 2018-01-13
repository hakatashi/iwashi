const qs = require('querystring');

module.exports = qs.parse(location.search.slice(1));
