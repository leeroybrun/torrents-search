var fs = require('fs'),
    path = require('path'),
    Tracker = require('./tracker'),
    utils = require('./utils');

// TODO: refactor to have a class to instanciate with "new", and pass it the name (and credentials ?) of the trackers to load.
// TODO: add method "getAvailableTrackers" to get available trackers name

var TorrentsSearch = function(trackers) {
    this.configDir = path.join(__dirname, '../config/');
    this.trackers = []; // Array of loaded trackers

    if(trackers != undefined && Object.keys(trackers).length > 0) {
        this.loadTrackersSync(trackers);
    }
}

// Get available trackers
TorrentsSearch.prototype.getAvailableTrackers = function(callback) {
    var self = this;
    
    fs.readdir(this.configDir, function (err, files) {
        if(err) { callback(err, null); }

        var trackers = [];
        var i = 0;

        files.forEach(function(file) {
            fs.readFile(self.configDir + file, function(err, data) {
                if(err) { callback(err, null); return; }

                var trackerData = JSON.parse(data);

                if('name' in trackerData && 'home' in trackerData) {
                    trackers.push({
                        'name': trackerData.name,
                        'url': trackerData.home
                    });

                    i++;

                    if(files.length == i) {
                        callback(null, trackers);
                    }
                }
            });
        });
    });
};
    
// Load all trackers config
TorrentsSearch.prototype.loadTrackers = function(config, callback) {
    callback = callback || function(err) {};

    var self = this;
    
    var i = 0;
    // Loop over all trackers defined in config and load file
    for(var trackerName in config) {
        var filePath = path.join(self.configDir, trackerName +'.json');

        // TODO: find a better async way to check if file exists
        if(fs.existsSync(filePath)) {
            fs.readFile(filePath, function(err, data) {
                if(err) { callback(err); return; }

                var trackerConfig = JSON.parse(data);

                utils.log('['+trackerConfig.name+'] Loading config...');
                
                // Create new tracker and add it to loaded ones
                self.trackers.push(new Tracker(trackerConfig, config[trackerConfig.name]));

                i++;
                                            
                // When all files are loaded, execute the callback
                if(i === Object.keys(config).length) { callback(null); }
            });
        } else {
            utils.log('['+trackerConfig.name+'] Cannot load config file...')
        }
    };
};

    // Load all trackers config (sync)
TorrentsSearch.prototype.loadTrackersSync = function(config) {
    var self = this;
    
    var i = 0;
    // Loop over all trackers defined in config and load file
    for(var trackerName in config) {
        var filePath = path.join(self.configDir, trackerName +'.json');

        try {
            var data = fs.readFileSync(filePath);
        } catch (e) {
            utils.log('['+trackerName+'] Cannot load config file...');
        }

        utils.log('['+trackerName+'] Loading config...');
                
        // Create new tracker and add it to loaded ones
        self.trackers.push(new Tracker(JSON.parse(data), config[trackerName]));

        i++;
                                    
        // When all files are loaded, return
        if(i === Object.keys(config).length) {
            if(self.trackers.length > 0) {
                return true;
            } else {
                return false;
            }   
        }
    };
};
    
    // Set trackers config (username & password)
TorrentsSearch.prototype.setCredentials = function(config, callback) {
    callback = callback || function(err) {};

    var self = this;
    
    var i = 0;
    // Loop over all trackers defined in config and set config
    for(var trackerName in config) {
        self.trackers.forEach(function(tracker) {
            if(tracker.config.name == trackerName) {
                tracker.setCredentials(config[trackerName]);

                i++;

                if(i == Object.keys(config).length) {
                    return true;
                }
            }
        });
    };
};
    
    // Login to each trackers
TorrentsSearch.prototype.login = function(callback) {
    callback = callback || function(status) {};
    var error = false;
    var self = this;

    var i = 0;
    this.trackers.forEach(function(tracker) {
        tracker.login(function(status) {
            if(status == false) { utils.log("["+tracker.config.name+"] Login failed."); error = true; }

            i++;
            
            // Call callback when we are on the last tracker
            if(i == self.trackers.length) {
                callback(!error);
            }
        });
    });
};
    
    // Search for a torrent
TorrentsSearch.prototype.search = function(searchText, type, callback) {
    callback = callback || function(trackers) {};

    var self = this;
    var allTorrents = [];

    this.login(function(status) {
        if(status === false) { console.log('Login error to trackers...'); return; }
    
        var i = 0;
        self.trackers.forEach(function(tracker) {
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
                if(i == self.trackers.length) {
                    callback(null, allTorrents);
                }
            });
        });
    });
};

// TODO: Better way to download torrent ? Pass torrent object ? Add method .download to torrent object ?
TorrentsSearch.prototype.download = function(trackerName, torrentCustom, callback) {
    var found = false;

    this.trackers.forEach(function(tracker) {
        if(tracker.config.name == trackerName) {
            found = true;
            tracker.dlTorrent(torrentCustom, callback);
        }
    });

    if(!found) {
        callback('Tracker not found.', null);
    }
};

module.exports = TorrentsSearch;