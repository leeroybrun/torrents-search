var fs = require('fs'),
    path = require('path'),
    Tracker = require('./tracker');

var trackers = {
    
    configDir: path.join(path.dirname(require.main.filename), 'config/'),
    loaded: [], // Array of loaded trackers
    
    // Load all trackers config
    load: function(config, callback) {
        callback = callback || function(err) {};
        
        // Loop over all trackers defined in config and load file
        config.forEach(function(tracker) {

            var filePath = path.join(trackers.configDir, tracker.name +'.json');
            
            fs.stat(filePath, function(err, stat) {
                if(stat.isFile()) {
                    fs.readFile(filePath, function(err, data) {
                        if(err) { callback(err); return; }
                        
                        // Create new tracker and add it to loaded ones
                        trackers.loaded.push(new Tracker(JSON.parse(data), tracker.login));
                                                    
                        // When all files are loaded, execute the callback
                        if(tracker === config[config.length - 1]) { callback(null); }
                    });
                }
            });
        });
    },
    
    // Login to each trackers
    login: function(callback) {
        callback = callback || function(status) {};
        var error = false;
        
        this.loaded.forEach(function(tracker) {
            tracker.login(function(status) {
                if(status == false) { console.log("["+tracker.config.name+"] Login failed."); error = true; }
                
                // Call callback when we are on the last tracker
                if(tracker === this.loaded[this.loaded - 1]) {
                    callback(!error);
                }
            });
        });
    },
    
    // Search for a torrent
    search: function(searchText, type, callback) {
        callback = callback || function(trackers) {};
        
        this.loaded.forEach(function(tracker) {
            tracker.search(searchText, type, function(torrents) {
                if(torrents.length === 0) { console.log("["+tracker.config.name+"] Search failed or no torrent found."); callback([]); return; }
                
                // Pass the torrents to the callback
                callback(torrents);
            });
        });
    }
}

module.exports = trackers;