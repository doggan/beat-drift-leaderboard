'use strict';
/*jshint expr: true*/
/*global describe, it, before, after, beforeEach*/

var expect = require('chai').expect,
    request = require('request'),
    async = require('async'),
    server = require('./../lib/server'),
    computeHash = require('./../lib/api/v0/index.js').computeHash,
    test_flushdb = require('./../lib/api/v0/index.js').test_flushdb;

var PORT = 3000;
var URL = 'http://localhost:' + PORT + '/api/v0';

function createGetURI(leaderboardId, start, count) {
    var uri = URL + '/leaderboards/' + leaderboardId;

    var isFirst = true;
    if (typeof start !== 'undefined') {
        uri += '?start=' + start;
        isFirst = false;
    }
    if (typeof count !== 'undefined') {
        if (isFirst) uri += '?';
        else uri += '&';

        uri += 'count=' + count;
    }

    return uri;
}

function createPostURI(leaderboardId, name, score, offset, count) {
    var uri = URL + '/leaderboards/' + leaderboardId;
    uri += '?name=' + name;
    uri += '&score=' + score;
    uri += '&hash=' + computeHash(leaderboardId, name, score);

    if (typeof offset !== 'undefined') {
        uri += '&offset=' + offset;
    }
    if (typeof count !== 'undefined') {
        uri += '&count=' + count;
    }

    return uri;
}

describe('api-v0', function() {
    before(function(done){
        server.start(PORT);

        test_flushdb(done);
    });

    after(function(done) {
        server.shutdown();
        done();
    });

    var LEADERBOARD_ID = "test_leaderboard_0";

    describe('GET - /leaderboards/:leaderboardId', function() {
        var MAX_SCORE = 20;

        before(function(done) {
            // Add a bunch of entries to the leaderboard.
            var entries = [];
            for (var i = 0; i < MAX_SCORE; i++) {
                entries.push({
                    name: "Mr. " + i,
                    score: MAX_SCORE - i
                });
            }

            async.eachSeries(entries, function(entry, cb) {
                var uri = createPostURI(LEADERBOARD_ID, entry.name, entry.score);
                request.post(uri, function(error, res) {
                    expect(error).to.not.exist;
                    expect(res.statusCode, res.body).to.equal(200);
                    cb();
                });
            }, function(err) {
                expect(err).to.not.exist;
                done();
            });
        });

        it('should query top scores from the leaderboard', function(done) {
            var uri = createGetURI(LEADERBOARD_ID);
            request.get(uri, function(error, res, body) {
                expect(error).to.not.exist;
                expect(res.statusCode, body).to.equal(200);

                body = JSON.parse(body);

                // The default count for a GET request when no count is specified.
                // Defined in index.js.
                var DEFAULT_COUNT = 10;

                var rankings = body.rankings;
                expect(rankings.length).to.equal(DEFAULT_COUNT);

                for (var i = 0; i < DEFAULT_COUNT; i++) {
                    expect(rankings[i].name).to.equal('Mr. ' + i);
                    expect(rankings[i].rank).to.equal(i);
                    expect(rankings[i].score).to.equal(MAX_SCORE - i);
                }

                done();
            });
        });

        it('should query top X scores from the leaderboard', function(done) {
            var uri = createGetURI(LEADERBOARD_ID, 0, 3);
            request.get(uri, function(error, res, body) {
                expect(error).to.not.exist;
                expect(res.statusCode, body).to.equal(200);

                body = JSON.parse(body);

                var rankings = body.rankings;
                expect(rankings.length).to.equal(3);

                for (var i = 0; i < 3; i++) {
                    expect(rankings[i].name).to.equal('Mr. ' + i);
                    expect(rankings[i].rank).to.equal(i);
                    expect(rankings[i].score).to.equal(MAX_SCORE - i);
                }

                done();
            });
        });
    });

    describe('POST - /leaderboards/:leaderboardId', function() {
        beforeEach(function(done) {
            test_flushdb(done);
        });

        it('should post a new score to the leaderboard', function(done) {
            var uri = createPostURI(LEADERBOARD_ID, 'Ray', 12);
            request.post(uri, function(error, res, body) {
                expect(error).to.not.exist;
                expect(res.statusCode, body).to.equal(200);

                done();
            });
        });

        it('should post a new score to the leaderboard and get the posted score', function(done) {
            var uri = createPostURI(LEADERBOARD_ID, 'Ellen', 5, 0, 1);
            request.post(uri, function(error, res, body) {
                expect(error).to.not.exist;
                expect(res.statusCode, res.body).to.equal(200);

                body = JSON.parse(body);

                var rankings = body.rankings;
                expect(rankings.length).to.equal(1);
                expect(rankings[0].name).to.equal('Ellen');
                expect(rankings[0].score).to.equal(5);
                expect(rankings[0].rank).to.equal(0);

                done();
            });
        });

        it('should post a new score to the leaderboard and get nearby scores', function(done) {
            async.series([
                function(cb) {
                    var uri = createPostURI(LEADERBOARD_ID, 'Mr. A', 5);
                    request.post(uri, function(error, res) {
                        expect(error).to.not.exist;
                        expect(res.statusCode, res.body).to.equal(200);
                        cb();
                    });
                }, function(cb) {
                    var uri = createPostURI(LEADERBOARD_ID, 'Mr. B', 20);
                    request.post(uri, function(error, res) {
                        expect(error).to.not.exist;
                        expect(res.statusCode, res.body).to.equal(200);

                        cb();
                    });
                }, function(cb) {
                    var uri = createPostURI(LEADERBOARD_ID, 'Mr. C', 15, -1, 2);
                    request.post(uri, function(error, res, body) {
                        expect(error).to.not.exist;
                        expect(res.statusCode, res.body).to.equal(200);

                        body = JSON.parse(body);

                        var rankings = body.rankings;

                        // Rankings:
                        //  0). Mr. B
                        //  1). Mr. C
                        //  2). Mr. A

                        expect(rankings.length).to.equal(2);
                        expect(rankings[0].name).to.equal('Mr. B');
                        expect(rankings[0].score).to.equal(20);
                        expect(rankings[0].rank).to.equal(0);

                        expect(rankings[1].name).to.equal('Mr. C');
                        expect(rankings[1].score).to.equal(15);
                        expect(rankings[1].rank).to.equal(1);

                        cb();
                    });
                }], function() {
                    done();
                });
        });
    });
});
