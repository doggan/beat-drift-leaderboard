'use strict';

var _ = require('lodash'),
    assert = require('assert'),
    Leaderboard = require('./leaderboard'),
    LEADERBOARD_IDS = require('./leaderboard_ids');

/**
 * The max # of entries that can be returned by a query.
 */
var MAX_COUNT = 20;
/**
 * The default # of entries returned if no count is specified.
 */
var DEFAULT_COUNT = 10;

var LEADERBOARDS = [];

// Build the leaderboards.
_(LEADERBOARD_IDS).forEach(function(leaderboardId) {
    var leaderboard = new Leaderboard(leaderboardId);
    LEADERBOARDS.push(leaderboard);
});

function getLeaderboard(leaderboardId) {
    var index = _.indexOf(LEADERBOARD_IDS, leaderboardId);
    if (index === -1 || index >= LEADERBOARDS.length) {
        return null;
    }

    return LEADERBOARDS[index];
}

function newError(status, msg) {
    var err = new Error();
    err.status = status;
    err.message = msg;
    return err;
}

function computeHash(leaderboardId, name, score) {
    // TODO:
    return 'abc';
}

/**
 * Get the model block data for the specified id.
 */
function getRankings(req, res, next) {
    var leaderboardId = req.params.leaderboardId;

    if (!_.contains(LEADERBOARD_IDS, leaderboardId)) {
        return next(newError(404, 'Invalid leadboard id.'));
    }

    var start = Number(req.query.start);
    if (isNaN(start)) {
        start = 0;
    }
    start = Math.max(start, 0);

    var count = Number(req.query.count);
    if (isNaN(count)) {
        count = DEFAULT_COUNT;
    }
    count = Math.max(Math.min(count, MAX_COUNT), 0);

    // No need to return any results.
    if (count === 0) {
        return res.status(200).end();
    }

    var leaderboard = getLeaderboard(leaderboardId);
    assert(leaderboard !== null);

    var fromRank = start;
    var toRank = fromRank + count - 1;
    leaderboard.getScoresForRankRange(fromRank, toRank, function(err, list) {
        if (err) return next(newError(500, err));

        var resObject = {
            rankings: list
        };

        return res.json(resObject);
    });
}

function postRanking(req, res, next) {
    var leaderboardId = req.params.leaderboardId;
    var name = req.query.name;
    var score = req.query.score;
    var hash = req.query.hash;

    if (!_.contains(LEADERBOARD_IDS, leaderboardId)) {
        return next(newError(404, 'Invalid leadboard id.'));
    }

    if (typeof name === 'undefined' ||
        typeof score === 'undefined' ||
        typeof hash === 'undefined') {
        return next(newError(400, 'name, score, and/or hash not specified.'));
    }

    score = parseInt(score);
    if (isNaN(score)) {
        return next(newError(400, 'Invalid score (must be a number).'));
    }

    var expectedHash = computeHash(leaderboardId, name, score);
    if (hash !== expectedHash) {
        return next(newError(403, 'Invalid hash.'));
    }

    var offset = Number(req.query.offset);
    if (isNaN(offset)) {
        offset = 0;
    }

    var count = Number(req.query.count);
    if (isNaN(count)) {
        count = 0;
    }
    count = Math.max(Math.min(count, MAX_COUNT), 0);

    var leaderboard = getLeaderboard(leaderboardId);
    assert(leaderboard !== null);

    leaderboard.addScore(name, score, function(err, entryId) {
        if (err) return next(newError(500, err));

        // No need to return any results.
        if (count === 0) {
            return res.status(200).end();
        }

        leaderboard.getRank(entryId, function(err, rank) {
            if (err) return next(newError(500, err));

            var fromRank = rank + offset;
            var toRank = fromRank + count - 1;
            leaderboard.getScoresForRankRange(fromRank, toRank, function(err, list) {
                if (err) return next(newError(500, err));

                var resObject = {
                    rankings: list
                };

                return res.json(resObject);
            });
        });
    });
}

function handleErrors(err, req, res, next) {
    res.status(err.status).send({
        message: err.message
    });

    next();
}

var express = require('express');
var app = express();

module.exports = {
    app: app,
    computeHash: computeHash,

    test_flushdb: function(cb) {
        var leaderboard = getLeaderboard('test_leaderboard_0');
        leaderboard.client.flushdb(cb);
    }
};

// Route declarations.
app.get('/leaderboards/:leaderboardId', getRankings);
app.post('/leaderboards/:leaderboardId', postRanking);

app.use(handleErrors);
