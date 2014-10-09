'use strict';

var PORT = null;
var PROJECT_DIR = require('path').dirname(require.main.filename);

// Supported API versions and their URI path.
var API_VERSIONS = {
    'v0' : '/api/v0'
};

function setup(app) {
    app.use(function (req, res, next) {
        // Website you wish to allow to connect.
        res.setHeader('Access-Control-Allow-Origin', '*');

        next();
    });
}

module.exports = {
    PORT: PORT,
    PROJECT_DIR: PROJECT_DIR,
    API_VERSIONS : API_VERSIONS,
    setup: setup
};
