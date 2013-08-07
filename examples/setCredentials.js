var trackers = require('../lib/torrents.js');

global.debug = true;

trackers.loadTrackersSync([
	/*{
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
	},*/
	{
		name: 'frenchtorrentdb',
		login: {
			username: 'USERNAME',
			password: 'PASSWORD'
		}
	}
]);

trackers.setCredentials([
	/*{
		name: 't411',
		login: {
			username: 'NEW_USERNAME',
			password: 'NEW_PASSWORD'
		}
	},
	{
		name: 'smartorrent',
		login: {
			username: 'NEW_USERNAME',
			password: 'NEW_PASSWORD'
		}
	},*/
	{
		name: 'frenchtorrentdb',
		login: {
			username: 'NEW_USERNAME',
			password: 'NEW_PASSWORD'
		}
	}
]);

trackers.search('spiderman', 'movie', function(err, torrents) {
	if(err) { console.log('Error ! '+ err); return; }

	console.log(torrents.length +' torrents found !');
	//console.log(torrents);

	console.log('Download 1th torrent...');
	trackers.download(torrents[0].tracker, torrents[0].custom, function(error, torrentFile) {
		if(error) { console.log(error); return; }

		console.log(torrentFile);
	});
});