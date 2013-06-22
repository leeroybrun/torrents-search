var request = require('request'),
    cheerio = require('cheerio'),
    utils = require('./utils');

var userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31';

// TODO : wait some time between requests not to be detected/banned

// Tracker class
var Tracker = function(config, login) {
    // Define login fields
    config.login.fields[config.login.fieldsToFill.username] = login.username;
    config.login.fields[config.login.fieldsToFill.password] = login.password;

    this.config = config;
    this.logged = false;
    this.loginTime = 0;
    this.cookies = request.jar();
};

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
                
    request({url: self.config.home, method: 'GET', headers: {'User-Agent': userAgent}, jar: this.cookies}, function(error, response, body) {    
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

// Login to the tracker
Tracker.prototype.login = function(callback) {
    callback = callback || function(status) {};
    var self = this;
    
    // If we are already logged, nothing to do...
    this.isLogged(function(status) {
        if(status === true) { callback(true); return; }
        
        var lConfig = self.config.login;
        
        lConfig.headers['User-Agent'] = userAgent;
        
        var options = {
            url: lConfig.url,
            method: 'POST',
            form: lConfig.fields, 
            headers: lConfig.headers,
            followAllRedirects : true,
            jar: self.cookies
        };
    
        // Send the login form
        request(options, function(error, response, body) {
            if(error) { callback(false); return; }
            if(response.statusCode !== 200) { callback(false); return; }
                                            
            // Check login status
            self.isLogged(function(status) {
                if (status === true) {
                    // Login successful
                    callback(true);
                } else {
                    // Login failed
                    callback(false);
                }
            });
        });
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
            headers: sConfig.headers,
            followAllRedirects : true,
            jar: self.cookies
        };
        
        // Fields to send to the tracker, we merge default ones with the ones defined for the type of file to search
        var fields = utils.extend(sConfig.fields.default, sConfig.fields.options[type]);
        fields[sConfig.fieldsToFill.query] = text;
        
        // We define the right request field regarding the method used
        if (options.method === 'GET') {
            options.qs = fields;
        } else  {
            options.form = fields;
        }
                
        // Send the search form
        request(options, function(error, response, body) {
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
    
    torrentsEl.each(function(i, torrentEl) {
        var $torrentEl = $(this);

        // Parse torrent infos
        var torrent = {
            detailsUrl: $torrentEl.find(pConfig.detailsLink).eq(0).attr('href'),
            title: $torrentEl.find(pConfig.title).eq(0).text(),
            size: $torrentEl.find(pConfig.size).eq(0).text(),
            seeders: $torrentEl.find(pConfig.seeders).eq(0).text(),
            leechers: $torrentEl.find(pConfig.leechers).eq(0).text(),
            tracker: self.config.name
        }
        
        // Parse torrent id
        if(pConfig.idRegex !== '') {
            var matchIdRegex = new RegExp(pConfig.idRegex);
            torrent.id = matchIdRegex.exec($torrentEl.find(pConfig.id))[1];
        } else {
            torrent.id = $torrentEl.find(pConfig.id).eq(0).text();
        }
        
        torrents.push(torrent);
        
        // When all torrents are parsed, call callback
        if (i == torrentsEl.length-1) {
            callback(null, torrents);
        }
    });
};

module.exports = Tracker;