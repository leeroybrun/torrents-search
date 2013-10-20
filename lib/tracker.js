var request = require('request'),
    cheerio = require('cheerio'),
    utils = require('./utils');

// TODO : wait some time between requests not to be detected/banned

// Tracker class
var Tracker = function(config, login) {
    this.config = config;
    this.logged = false;
    this.loginTime = 0;
    this.cookies = request.jar();

    this.setCredentials(login);
};

Tracker.prototype.setCredentials = function(login) {
    // Define login fields
    this.config.login.fields[this.config.login.fieldsToFill.username] = login.username;
    this.config.login.fields[this.config.login.fieldsToFill.password] = login.password;
}

// Wrapper arround the request module, define default options
// TODO : use request.defaults instead ? To test.
Tracker.prototype.request = function(options, callback) {
    // Headers not set in the options, create empty object
    if(!('headers' in options) || typeof options.headers != 'object') {
        options.headers = {};
    }

    options.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31';
    options.followAllRedirects = true;
    options.jar = this.cookies;

    // We define the right request params regarding the method used
    if('params' in options) {
        if (options.method === 'GET') {
            options.qs = options.params;
        } else  {
            options.form = options.params;
        }

        delete options.params;
    }
    
    // Send the request
    request(options, callback);
}

// Check login status on tracker
Tracker.prototype.isLogged = function(callback) {
    callback = callback || function(status) {};
    var self = this;
    
    // Check if already logged less than 5 minutes ago
    if(this.logged && (Date.now() - this.loginTime) < 300000) {
        callback(true);
        return;
    } else {
        // If not logged or more than 5 minutes ago, we presume that we are not logged anymore and we need to check again
        this.logged = false;
    }
                
    this.request({url: self.config.home, method: 'GET'}, function(error, response, body) {    
        var $ = cheerio.load(body);
        
        if($(self.config.login.check).length > 0) {            
            self.logged = true;
            self.loginTime = Date.now();
            
            callback(true);
        } else {
            callback(false);
        }
    });
};

// Get CSRF value from login form
Tracker.prototype.getCSRF = function(callback) {
    var csrfConf = this.config.login.csrf;
    var self = this;

    // If tracker does not use CSRF, nothing to do...
    if(csrfConf === false) {
        callback(true);

    } else {
        utils.log('['+this.config.name+'] Getting CSRF value...');

        var options = {
            url: csrfConf.formUrl,
            method: 'GET'
        };

        // Get the login form
        this.request(options, function(error, response, body) {
            if(error) { utils.log('['+self.config.name+'] Cannot get login form for CSRF : '+ error +'.'); callback(false); return; }
            if(response.statusCode !== 200) { utils.log('['+self.config.name+'] Cannot get login form for CSRF : '+ response.statusCode +'.'); callback(false); return; }
                                            
            var $ = cheerio.load(body);

            var $csrfField = $('input[name="'+csrfConf.field+'"]');
            if($csrfField.length > 0) {
                utils.log('['+self.config.name+'] CSRF value : '+ $csrfField.val());

                self.config.login.fields[csrfConf.field] = $csrfField.val();

                callback(true);
            } else {
                utils.log('['+self.config.name+'] Cannot find CSRF field.');
                callback(false);
            }
        });
    }
}

// Login to the tracker
Tracker.prototype.login = function(callback) {
    callback = callback || function(status) {};
    var self = this;
    
    // If we are already logged, nothing to do...
    this.isLogged(function(status) {
        if(status === true) { utils.log('['+self.config.name+'] Already logged.'); callback(true); return; }

        // Really dirty fix for the new FrenchTorrentDB login form
        // Soon I will refactor the module and implement a more beautiful way
        if(self.config.name == 'frenchtorrentdb') {
            self.request({url: 'http://www.frenchtorrentdb.com/?section=LOGIN&challenge=1', method: 'GET', json: true}, function(error, response, data) {
                if(error || response.statusCode !== 200) { console.log(error); console.log(response.statusCode); utils.log('['+self.config.name+'] FrenchTorrentDB login error.'); callback(false); return; }
            
                self.config.login.fields.hash = data.hash;

                var a = '05f';
                var challenge = '';
                for (i in data.challenge) {
                    challenge += '' + eval(data.challenge[i]);
                }

                self.config.login.fields.secure_login = challenge;
            
                doLogin();
            });
        } else {
            doLogin();
        }

        function doLogin() {        
            var lConfig = self.config.login;

            var options = {
                url: lConfig.url,
                method: 'POST',
                form: lConfig.fields, 
                headers: lConfig.headers
            };

            // Send the login form
            self.request(options, function(error, response, body) {
                if(error) { utils.log('['+self.config.name+'] Login error : '+ error +'.'); callback(false); return; }
                if(response.statusCode !== 200) { utils.log('['+self.config.name+'] Login error : '+ response.statusCode +'.'); callback(false); return; }
                   
                // Check login status
                self.isLogged(function(status) {
                    if (status === true) {
                        // Login successful
                        utils.log('['+self.config.name+'] Login successful.');
                        callback(true);
                    } else {
                        // Login failed
                        utils.log('['+self.config.name+'] Login failed.');
                        callback(false);
                    }
                });
            });
        }
    });
};

// Search torrent
Tracker.prototype.search = function(text, type, callback) {
    if (typeof text === 'undefined') { callback('Please provide a text to search.', []); return; }
    type = type || 'movie';
    callback = callback || function(status) {};

    var self = this;
    
    // Do / check login to the tracker
    this.login(function(status) {
        if (status === false) { callback("["+self.config.name+"] Can't search on tracker, login failed.", []); return; }
        
        var sConfig = self.config.search;
        
        // Request options
        var options = {
            url: sConfig.url,
            method: sConfig.method, 
            headers: sConfig.headers
        };
        
        // Fields to send to the tracker, we merge default ones with the ones defined for the type of file to search
        var fields = utils.extend(sConfig.fields.default, sConfig.fields.options[type]);
        fields[sConfig.fieldsToFill.query] = text;
        
        // Define request params
        options.params = fields;
                
        // Send the search form
        self.request(options, function(error, response, body) {
            if(error) { callback(error, []); return; }
            if(response.statusCode !== 200) { callback('Error with search form : '+ response.statusCode, []); return; }
                            
            // Parse results
            self.parse(body, callback);
        });
    });    
};

Tracker.prototype.parse = function(body, callback) {
    var self = this;
    
    var pConfig = this.config.parse;
    
    var $ = cheerio.load(body);
    var torrentsEl = $(pConfig.item);
    
    // No torrents found
    if (torrentsEl.length === 0) {
        callback('No torrents found', []);

        return;
    }
    
    var torrents = [];
    
    torrentsEl.each(function(i, el) {
        var $torrentEl = $(this);

        // Parse torrent infos
        var torrent = {
            detailsUrl: $torrentEl.find(pConfig.detailsLink).eq(0).attr('href').trim(),
            title: $torrentEl.find(pConfig.title).eq(0).text().trim(),
            size: $torrentEl.find(pConfig.size).eq(0).text().trim(),
            seeders: $torrentEl.find(pConfig.seeders).eq(0).text().trim(),
            leechers: $torrentEl.find(pConfig.leechers).eq(0).text().trim(),
            tracker: self.config.name,
            custom: {}
        }
        
        // Parse custom fields
        // TODO : check if .find() and REGEX returned something before adding it to torrent.custom
        for(var paramName in pConfig.custom) {
            if(typeof pConfig.custom[paramName] == 'object') {
                var regex = new RegExp(pConfig.custom[paramName].regex);
                var regexMatches = regex.exec($.html($torrentEl.find(pConfig.custom[paramName].selector).eq(0)));
                if(regexMatches != null && regexMatches.length > 1) {
                    torrent.custom[paramName] = regexMatches[regexMatches.length - 1].trim();
                }
            } else {
                torrent.custom[paramName] = $torrentEl.find(pConfig.custom[paramName]).eq(0).text().trim();
            }
        }
        
        torrents.push(torrent);
        
        // When all torrents are parsed, call callback
        if (i == torrentsEl.length-1) {
            callback(null, torrents);
        }
    });
};

Tracker.prototype.dlTorrent = function(torrentCustom, callback) {
    var self = this;
    
    // Do / check login to the tracker
    this.login(function(status) {
        if (status === false) { callback("["+self.config.name+"] Can't download torrent on tracker, login failed.", []); return; }

        var dlConfig = self.config.download;

        // Get default params
        var params = utils.extend({}, dlConfig.params.static);

        // Get custom params values from torrent object
        for(var paramName in dlConfig.params.custom) {
            var customName = dlConfig.params.custom[paramName];
            params[paramName] = torrentCustom[customName];
        }

        // Request options
        var options = {
            url: dlConfig.url,
            method: dlConfig.method, 
            headers: dlConfig.headers,
            encoding: null
        };
        
        // Define request params
        options.params = params;
                
        // Send the download request
        self.request(options, function(error, response, body) {
            if(error) { callback(error, null); return; }
            if(response.statusCode !== 200) { callback('Error while downloading torrent : '+ response.statusCode, null); return; }
                            
            // Call the callback with the torrent file data
            callback(null, body);
        });
    });
};

module.exports = Tracker;