# node-torrents-search

[![NPM](https://nodei.co/npm/torrents-search.png)](https://nodei.co/npm/torrents-search/) [![David DM](https://david-dm.org/leeroybrun/node-torrents-search.png)](https://david-dm.org/leeroybrun/node-torrents-search "David DM")

Node module used to search torrents on private trackers websites.

## Currently supported trackers

- t411
- FrenchTorrentDB
- Cpasbien

You can easily add new trackers by creating a file in `lib/trackers`.

## Install

```shell
npm install torrents-search
```

## Usage

```javascript
const TorrentsSearch = require('torrents-search');

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

		console.log('Downloading first torrent :');
		return search.download(torrents[0]);
	})
	.then((torrentFileBuffer) => {
		console.log(torrentFileBuffer);
	});
```

## Options

* `logger` This let you define a custom logger. It should have two methods : `info` and `error`. If you just want to log errors, just create an empty `info` method. Default is an empty logger that will do nothing.
* `timeout` Define the desired timeout (milliseconds) for requests sent to trackers. Default is 10000 (10s). This is a way to protect us from slow trackers who can block others.

## Events

* `on(trackers:loaded, function(trackers) {})`

	When trackers are loaded.

* `on(tracker:enabled, function(tracker) {})`

	When a tracker is enabled.

* `on(tracker:disabled, function(tracker) {})`

	When a tracker is disabled.

* `on(tracker:loginSuccess, function(tracker) {})`

	When a login is successfull on a tracker.

* `on(tracker:torrentsFound, function(torrents, tracker) {})`

	When torrents are found on a tracker.

* `on(tracker:torrentsSearchError, function(error, tracker) {})`

	When an error occurs during torrents search on a tracker.

* `on(tracker:torrentsSearchError, function(error, tracker) {})`

	When an error occurs during torrents search on a tracker.


## API

Here is the list of all available methods of the module.

* `loadTrackers()`

    Load all the trackers in the `lib/trackers` folder.
    You need to call this before calling any other method.
    All trackers loaded are disabled by default if they need authentification, or enabled if not.
    
    It returns a promise.

* `getTrackers()`

    Return an object `{ enabled: [], disabled: [] }` with the names of the loaded trackers.

* `enableTracker(trackerName)`

    Enable the specified tracker.
    
    Returns a boolean indicating if the operation succeeded or not.

* `disableTracker(trackerName)`

    Disable the specified tracker.
    
    Returns a boolean indicating if the operation succeeded or not.

* `setCredentials(trackerName, username, password)`

    Set the username/password used for the tracker.

* `login()`

    Login on all enabled trackers.
    This is automatically done when using a method requiring login (search, download).
    
    It returns a promise.

* `search(query, options, callback)`

    Search the specified `query` on all enabled trackers.
    
    Options is an object with the following properties :
    
    * `type` : `movie` or `tvshow`
    
    It returns a promise with an array of Torrent objects if resolved.

* `download(torrent, callback)`

    Download the specified `.torrent`.
    
    It returns a promise with an the file buffer of the `.torrent` if resolved.

## TODO

* Add tests
* Better size transformation/detection (especially for t411)
* Add more trackers
		* zetorrents
		* http://www.ultimate-torrent.com/
		* http://www.qctorrent.io/login
		* http://www.zone-torrent.net/
		* http://www.megatorrent.biz/
		* lien-torrent
		* http://torrentz.eu/
		* http://www.torrenthounds.com/
		* https://isohunt.to/

Licence
======================
(The MIT License)

Copyright (C) 2013 Leeroy Brun, www.leeroy.me

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/leeroybrun/node-torrents-search/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
