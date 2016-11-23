const TorrentsSearch = require('..');
const extend = require('extend');

// Custom logger
const myLogger = {
	info: function(msg) {
		console.log(msg);
	},

	error: function(msg) {
		console.error(msg);
	}
};

const search = new TorrentsSearch({
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
		search.enableTracker('Cpasbien');
	})
	.then(() => {
		// Search torrents on all enabled trackers
		return search.search('spiderman', {type: 'movie'});
	})
	.then((torrents) => {
		console.log(torrents.length +' torrent(s) found.');

		torrents.forEach((torrent) => {
      const t = extend(true, {}, torrent);
      delete t._tracker;

      console.log(t);
    });

		console.log('Downloading first torrent ('+ torrents[0].name +' from '+ torrents[0].tracker +') :');
		return search.download(torrents[0]);
	})
	.then((torrentFileBuffer) => {
		console.log(torrentFileBuffer);
	});
