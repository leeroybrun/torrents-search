# node-torrents-search

[![NPM](https://nodei.co/npm/torrents-search.png)](https://nodei.co/npm/torrents-search/)

Node module used to search torrents on private trackers websites.

## Currently supported trackers

- t411
- Smartorrent
- FrenchTorrentDB

You can easily add new trackers' config files inside the `config` directory.

## How to use it

You can find examples of using the module inside the `examples/` folder.

Here is the general principe of using the module :

1. Load trackers you want to use
2. Use other available methods (search, dlTorrent).

When using all the methods related to the tracker (search, dlTorrent), the module will start by checking if we already are logged. If we are not, it will automatically log you in.
Once logged in, the module will assume that we are logged in for the next 5 minutes. After this delay, it will recheck the connection status on the tracker.

## Methods

Here is the list of all available methods of the module.

### trackers.loadTrackers(config, callback)

Load the trackers defined inside the `config` object.

Config object format :

```javascript
var config = {
	'TRACKER-CONFIG-FILE-NAME-1': {
		'username': 'USERNAME',
		'password': 'PASSWORD'
	},
	'TRACKER-CONFIG-FILE-NAME-2': {
		'username': 'USERNAME',
		'password': 'PASSWORD'
	},
	...
};
```

The callback function takes only an `error` argument. If an error occured during the config files loading, it will contain the error. Ff no error occured, it will be set to `null`.

### trackers.loadTrackersSync(config)

### trackers.setCredentials(config)

### trackers.login(callback)

### trackers.search(searchText, type, callback)

### trackers.download(trackerName, torrentCustom, callback)

## Warning

This module is currently in active development, so the methods, config, etc can change a lot. Please do not use it in production environment or be very carefull when doing "npm update".

## Refactor

I need to do a big refactor to this module :

- Custom scripts for providers, not config files. This way we can handle more specific ways to login/search for each tracker.
- Configuration : custom logger, log level, etc
- Use async if needed to have a more beautiful code
- Send errors when no trackers are configured (when trying to search, download, etc)

Licence
======================
(The MIT License)

Copyright (C) 2013 Leeroy Brun, www.leeroy.me

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.