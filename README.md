# node-torrents-search

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

### trackers.setConfig(config, callback)

Load the trackers defined inside the `config` object.

Config object format :

```javascript
var config = [
	{
		name: 'TRACKER-CONFIG-FILE-NAME-1',
		login: {
			username: 'USERNAME',
			password: 'PASSWORD'
		}
	},
	{
		name: 'TRACKER-CONFIG-FILE-NAME-2',
		login: {
			username: 'USERNAME',
			password: 'PASSWORD'
		}
	},
	...
];
```

The callback function takes only an `error` argument. If an error occured during the config files loading, it will contain the error. Ff no error occured, it will be set to `null`.

### trackers.login(callback)

### trackers.search(searchText, type, callback)

### trackers.download(trackerName, torrentCustom, callback)