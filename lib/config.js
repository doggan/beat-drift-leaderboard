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

    // Reference: http://docs.unity3d.com/Manual/SecuritySandbox.html
    app.get("/crossdomain.xml", function(req, res) {
        var xml =
            '<?xml version="1.0"?>\n' +
            '<cross-domain-policy>\n' +
            '<allow-access-from domain="*"/>\n' +
            '</cross-domain-policy>\n';

        req.setEncoding('utf8');
        res.writeHead(200, {'Content-Type': 'text/xml'});
        res.end(xml);
    });
}

module.exports = {
    PORT: PORT,
    PROJECT_DIR: PROJECT_DIR,
    API_VERSIONS : API_VERSIONS,
    setup: setup
};
