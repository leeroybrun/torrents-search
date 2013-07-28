var trackers = require('../lib/trackers.js');

// Activate the debug, will output more messages (verbose)
global.debug = true;

// Load only the wanted trackers, and pass the USERNAME and PASSWORD for each tracker
trackers.load([
	{
		name: 't411',
		login: {
			username: 'USERNAME',
			password: 'PASSWORD'
		}
	},
	{
		name: 'smartorrent',
		login: {
			username: 'USERNAME',
			password: 'PASSWORD'
		}
	},
	{
		name: 'frenchtorrentdb',
		login: {
			username: 'USERNAME',
			password: 'PASSWORD'
		}
	}
], function(err) {
	if(err) { console.log('Error loading trackers.'); return; }

	// Login to all loaded trackers
	trackers.login(function(status) {
		if(status === false) { console.log('Login error...'); return; }

		console.log('Successful login.');

		// Search the movie on all loaded trackers
		trackers.search('spiderman', 'movie', function(err, torrents) {
			if(err) { console.log('Error ! '+ err); return; }

			console.log(torrents.length +' torrents found !');
			//console.log(torrents);

			console.log('Download 1th torrent...');
			// Download the first torrent found 
			// Will output the .torrent file content, you can then save it to disk if you need to.
			trackers.dlTorrent(torrents[0].tracker, torrents[0].custom, function(error, torrentFile) {
				if(error) { console.log(error); return; }

				// Print the torrent file content
				console.log(torrentFile);
			});
		});
	});
});