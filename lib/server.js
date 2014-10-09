'use strict';

var express = require('express'),
    config = require('./config'),
    routes = require('./routes');

var server;

function start(port) {
    if (typeof port == 'undefined') {
        console.error('Error: Port not specified.');
        return;
    }

    config.PORT = port;

    var app = express();

    config.setup(app);
    routes.setup(app);

    server = app.listen(config.PORT);

    console.log();
    console.log('leaderboard-server running...');
    console.log('...port [' + config.PORT + ']');
}

function shutdown() {
    console.log('shutting down leaderboard-server...');
    server.close();
}

module.exports = {
    start: start,
    shutdown: shutdown,
};
