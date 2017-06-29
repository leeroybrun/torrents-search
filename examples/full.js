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

    // Enable trackers
    search.enableTracker('Torrent9');
    search.enableTracker('1337x');

    search.enableTracker('TorrentLeech');
    search.setCredentials('TorrentLeech', 'USERNAME', 'PASSWORD');
  })
  .then(() => {
    // Search torrents on all enabled trackers
    return search.search('SEARCH_QUERY', {type: 'movies'});
  })
  .then((torrents) => {
    console.log(torrents.length +' torrent(s) found.');

    if(torrents.length === 0) {
      return null;
    }

    torrents.forEach((torrent) => {
      const t = extend(true, {}, torrent);
      delete t._tracker;

      console.log(t);
    });

    console.log('Downloading first torrent ('+ torrents[0].name +' from '+ torrents[0].tracker +') :');
    return search.download(torrents[0]);
  })
  .then((torrentFileBuffer) => {
    if(torrentFileBuffer) {
      console.log(torrentFileBuffer);
    }
  }).catch((reason) => {
    console.error('An error occured:');
    console.error(reason);
  });
