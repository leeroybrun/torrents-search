var TorrentsSearch = require('../lib/torrents.js');

global.debug = true;

var tSearch = new TorrentsSearch();

tSearch.getAvailableTrackers(function(err, trackers) {
	if(err) { console.log('Error ! '+ err); return; }

	console.log(trackers.length +' trackers found !');

	console.log(trackers);
});