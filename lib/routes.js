'use strict';

var config = require('./config');

function getAPIVersions(req, res) {
    res.json(config.API_VERSIONS);
}

function setup(app) {
    app.get('/api/versions', getAPIVersions);

    // Mount and use all supported API versions.
    for (var k in config.API_VERSIONS) {
        app.use(config.API_VERSIONS[k], require('.' + config.API_VERSIONS[k] + '/index').app);
    }
}

module.exports = {
    setup: setup
};
