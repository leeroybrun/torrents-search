var fs = require('fs'),
    path = require('path'),
    Tracker = require('./tracker'),
    utils = require('./utils');

var trackers = {
    
    configDir: path.join(__dirname, '../config/'),
    loaded: [], // Array of loaded trackers
    
    // Load all trackers config
    load: function(config, callback) {
        callback = callback || function(err) {};

        var self = this;
        
        // Loop over all trackers defined in config and load file
        config.forEach(function(tracker) {
            var filePath = path.join(trackers.configDir, tracker.name +'.json');

            fs.exists(filePath, function(exists) {
                if (exists) {
                    fs.readFile(filePath, function(err, data) {
                        if(err) { callback(err); return; }

                        utils.log('['+tracker.name+'] Loading config...');
                        
                        // Create new tracker and add it to loaded ones
                        self.loaded.push(new Tracker(JSON.parse(data), tracker.login));
                                                    
                        // When all files are loaded, execute the callback
                        if(tracker === config[config.length - 1]) { callback(null); }
                    });
                } else {
                    utils.log('['+tracker.name+'] Cannot load config file...')
                }
            });
        });
    },
    
    // Login to each trackers
    login: function(callback) {
        callback = callback || function(status) {};
        var error = false;
        var self = this;

        this.loaded.forEach(function(tracker) {
            tracker.login(function(status) {
                if(status == false) { utils.log("["+tracker.config.name+"] Login failed."); error = true; }
                
                // Call callback when we are on the last tracker
                if(tracker === self.loaded[self.loaded.length - 1]) {
                    callback(!error);
                }
            });
        });
    },
    
    // Search for a torrent
    search: function(searchText, type, callback) {
        callback = callback || function(trackers) {};

        var self = this;
        var allTorrents = [];
        
        var i = 0;
        this.loaded.forEach(function(tracker) {
            tracker.search(searchText, type, function(error, torrents) {
                i++;

                if(error) { 
                    utils.log('['+tracker.config.name+'] Error during search : '+ error +'.');
                } else if(torrents.length === 0) { 
                    utils.log("["+tracker.config.name+"] No torrent found.");
                } else {
                    // If no errors, add found torrents to the array
                    allTorrents = allTorrents.concat(torrents);
                }

                // Pass the torrents to the callback
                if(i == self.loaded.length) {
                    callback(null, allTorrents);
                }
            });
        });
    },

    dlTorrent: function(trackerName, torrentCustom, callback) {
        console.log('dl torrent function');
        var found = false;

        this.loaded.forEach(function(tracker) {
            if(tracker.config.name == trackerName) {
                found = true;
                tracker.dlTorrent(torrentCustom, callback);
            }
        });

        if(!found) {
            callback('Tracker not found.', null);
        }
    }
}

module.exports = trackers;