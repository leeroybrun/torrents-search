var TorrentsSearch = require('..');

// Custom logger
var myLogger = {
	info: function(msg) {
		console.log(msg);
	},

	error: function(msg) {
		console.error(msg);
	}
};

var search = new TorrentsSearch({
	logger: myLogger, // Optional
	timeout: 100000 // Optional
});

search.loadTrackers()
	.then(() => {
		// Display all loaded trackers
		console.log('Loaded trackers :', search.getTrackers());

		// Enable a tracker
		search.enableTracker('t411');
		search.setCredentials('t411', 'USERNAME', 'PASSWORD');

		// Enable a tracker
		search.enableTracker('FrenchTorrentDB');
		search.setCredentials('FrenchTorrentDB', 'USERNAME', 'PASSWORD');

		// Enable a tracker
		search.enableTracker('Smartorrent');
		search.setCredentials('Smartorrent', 'USERNAME', 'PASSWORD');
	})
	.then(() => {
		// Search torrents on all enabled trackers
		return search.search('spiderman', {type: 'movie'}).then((torrents) => {
			console.log(torrents.length +' torrent(s) found.');

			console.log('Downloading first torrent :');
		});
	})
	.then(() => {
		return search.download(torrents[0]);
	})
	.then((torrentFileBuffer) => {
		console.log(torrentFileBuffer);
	});
