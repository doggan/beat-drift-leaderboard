var URL = 'http://ec2-54-69-109-73.us-west-2.compute.amazonaws.com:8091/api/v0/leaderboards/';
// var URL = 'http://127.0.0.1:8091/api/v0/leaderboards/';

var MAX_NAME_LENGTH = 16;

function trimName(name) {
    if (name.length <= MAX_NAME_LENGTH) {
        return name;
    }

    return name.substring(0, MAX_NAME_LENGTH) + "...";
}

/**
 * Callback to alert application that the user name needs to be updated.
 */
function refreshUserName() {
    var userName = $('#user-name-input').val();

    var unity = unityObject.getUnity();
    if (unity !== null) {
        // Explicit check for the property in case we try to send
        // messages before the object is fully loaded.
        if (unity.hasOwnProperty('SendMessage')) {
            unity.SendMessage("HtmlNameListener", "OnNameRefreshed", userName);
        }
    }
}

/**
 * Called from application when POST response is received
 * with the rank information of the user.
 */
function refreshUserRank(leaderboardId, totalCount, name, rank, score) {

    var html = 'YOUR MOST RECENT RANK: <b>#' + rank + '</b> OUT OF ' + totalCount;
    $('#recent-user-score').html(html);
    $('#recent-user-score').css('padding-top', '10px');

    // If we're in top 10, update the leaderboard display as well.
    if (rank <= 10) {
        populateLeaderboardTable(leaderboardId);
    }
}

function createHtmlForLeaderboard(rankings) {
    var html =
        '<table class="pure-table pure-table-horizontal leaderboard-table">' +
        // '<thead><tr><th>#</th><th>Name</th><th>Time</th></tr></thead>' +
        '<tbody>';

    var len = rankings.length;
    for (var i = 0; i < len; i++) {
        var entry = rankings[i];

        if ((i % 2) === 0) {
            html += '<tr class="table-odd">';
        }
        else {
            html += '<tr class="table-even">';
        }

        html += '<td class="leaderboard-rank-cell">' + (entry.rank + 1) + '</td>';
        html += '<td class="leaderboard-name-cell">' + trimName(entry.name) + '</td>';
        html += '<td class="leaderboard-score-cell">' + (entry.score / 100).toFixed(2) + 's</td>';
    }

    html += '</tbody></table>';

    return html;
}

function populateLeaderboardTable(leaderboardId) {
    var divId = leaderboardIdToDivId(leaderboardId);
    if (!divId) {
        return;
    }

    var uri = URL + leaderboardId;
    $.get(uri, function(data) {
        var html = createHtmlForLeaderboard(data.rankings);

        $('#' + divId).html(html);
    });

}

function leaderboardIdToDivId(leaderboardId) {
    switch (leaderboardId) {
        case 'beat_drift_webtrial_genesis': return 'leaderboard-genesis';
        case 'beat_drift_webtrial_awaken': return 'leaderboard-awaken';
        case 'beat_drift_webtrial_flare': return 'leaderboard-flare';
        default:
            console.warn('Unhandled leaderboard id: ' + leaderboardId);
            return null;
    }
}

$(document).ready(function(){
    // Set this div to the same width as the player to verify it stays centered.
    $('#unityPlayer').css('width', UNITY_CONFIG.width + 'px');

    // Callback for refreshing in-game user name when form value changes.
    $('#user-name-input').keyup(refreshUserName);

    populateLeaderboardTable('beat_drift_webtrial_genesis');
    populateLeaderboardTable('beat_drift_webtrial_awaken');
    populateLeaderboardTable('beat_drift_webtrial_flare');
});
