import request from 'request';
import cheerio from 'cheerio';
import async from 'async';
import extend from 'extend';

// Tracker class
class Tracker {
  /*********************************************************
   * Constructor
   ********************************************************/
  constructor(options) {
    options = options || {};

    this.options = {
      timeout: options.timeout || 10000
    };

    this.name = '';
    this.enabled = false;

    this._urls: {
      'home':       '',
      'login':      '',
      'loginCheck': '',
      'search':     '',
      'download':   ''
    };

    this._cats = {
      'movie': {},
      'tvshow': {}
    }

    this._login = {
      status: false,
      lastLogin: 0,
      username: '',
      password: ''
    };

    this._cookies = request.jar();
  }

  /*********************************************************
   * Public methods
   ********************************************************/

  /**
   *  Set credentials for the tracker
   */
  setCredentials: function(username, password) {
    this._login.username = username;
    this._login.password = password; // TODO: find more secure way to store password?
  },

  /**
   *  Check if we are logged in on tracker
   *      - Last login < 5 mins ago -> we presume we are logged in
   *      - Last login > 5 mins ago -> we fetch the tracker's "loginCheck" url and checkLoginSuccess
   */
  isLogged: function() {
    // Check if already logged in less than 5 minutes ago
    if(this._login.status && (Date.now() - this._login.lastLogin) < 300000) {
      return Promise.resolve(true);
    }

    // If not logged in or more than 5 minutes ago, we presume that we are not logged anymore and we need to check again
    this._login.status = false;

    return this._request({url: this._urls.loginCheck, method: 'GET'}).then((body) => {
      if(!this._checkLoginSuccess(body)) {
        return Promise.resolve(false);
      }

      this._login.status = true;
      this._login.lastLogin = Date.now();

      return Promise.resolve(true);
    });
  },

  /**
   *  Check if we are logged in on the tracker, and if not -> do the login
   */
  login: function() {
    return new Promise((resolve, reject) => {
      this.isLogged().then((status) => {
        if(status === true) {
          return resolve(); // This way we stop the waterfall, we are already logged in
        }

        return this._getLoginData((data) => {
          return this._request({
            url: that._urls.login,
            method: data.method,
            form: data.fields,
            headers: data.headers
          });
        }).then(() => {
          // Login successful
          if(this._checkLoginSuccess(body) === false) {
            return reject(new Error('An error occured during the login process.'));
          }

          this._login.status = true;
          this._login.lastLogin = Date.now();

          return resolve();
        }).catch((reason) => {
          return reject(reason);
        });
      })
    });
  }

  /**
   *  Search for torrents on the tracker
   */
  search: function(text, options) {
    if (typeof text === 'undefined') {
      return Promise.reject(new Error('Please provide a text to search.'));
    }

    options = options || {};
    options.type = options.type || 'movie';

    return this.login()
      .then(this._getSearchData)
      .then((data) => {
        if(this._cats[options.type]) {
          data.fields = extend(data.fields, this._cats[options.type]);
        }

        return this._request({
          url: that._urls.search,
          method: data.method,
          headers: data.headers,
          params: data.fields
        });
      })
      .then((body) => {
        return this.parse(body);
      });
  }

  /**
   *  Parse tracker's search page results
   */
  parse: function(body) {
    return this._getParseData()
      .then((parseData) => {
        var $ = cheerio.load(body);
        var torrentsEl = $(parseData.item);

        // No torrents found
        if (torrentsEl.length === 0) {
          return [];
        }

        var torrents = [];
        const promises = [];

        torrentsEl.forEach((torrentEl) => {
          var $torrentEl = $(torrentEl);

          // Parse torrent infos
          var torrent = {
            detailsUrl: $torrentEl.find(parseData.detailsLink).eq(0).attr('href').trim(),
            title: $torrentEl.find(parseData.title).eq(0).text().trim(),
            size: $torrentEl.find(parseData.size).eq(0).text().trim(),
            seeders: parseInt($torrentEl.find(parseData.seeders).eq(0).text().trim()),
            leechers: parseInt($torrentEl.find(parseData.leechers).eq(0).text().trim()),
            tracker: that.name,
            data: {}
          }

          // Parse custom fields
          for(var paramName in parseData.data) {
            if(typeof parseData.data[paramName] == 'object') {
              var regex = new RegExp(parseData.data[paramName].regex);
              var regexMatches = regex.exec($.html($torrentEl.find(parseData.data[paramName].selector).eq(0)));
              if(regexMatches != null && regexMatches.length > 1) {
                torrent.data[paramName] = regexMatches[regexMatches.length - 1].trim();
              }
            } else {
              torrent.data[paramName] = $torrentEl.find(parseData.data[paramName]).eq(0).text().trim();
            }
          }

          torrents.push(torrent);
        });

        return torrents;
      });
  }

  /**
   *  Download a .torrent on the specified tracker
   */
  download: function(torrent) {
    return this.login()
      .then(this._getDownloadData)
      .then((data) => {
        return this._request({
          url: this._urls.download,
          method: data.method,
          headers: data.headers,
          params: data.fields,
          encoding: null
        });
      });
  }

  /*********************************************************
   * "Private" methods (not private at all, just no reason to use them outside)
   ********************************************************/

  /**
   *  Wrapper arround the request module, set default options
   */
  _request: function(options) {
    // Headers not set in the options, create empty object
    if(!('headers' in options) || typeof options.headers != 'object') {
      options.headers = {};
    }

    options.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31';
    options.followAllRedirects = true;
    options.jar = this._cookies;
    options.timeout = this.options.timeout; // We add a timeout to the request, for slow trackers to not block others

    // We define the right request params regarding the method used
    if('params' in options) {
      if (options.method === 'GET') {
        options.qs = options.params;
      } else  {
        options.form = options.params;
      }

      delete options.params;
    }

    return new Promise((resolve, reject) => {
      // Send the request
      request(options, (error, response, body) => {
        if(error) {
          return reject(error);
        } else if(response.statusCode !== 200) {
          return reject(new Error('Response status code : '+ response.statusCode));
        }

        return resolve(body);
      });
    });
  }

  /**
   *  Check for string/element inside the provided body to check for login success/failure
   */
  _checkLoginSuccess: function(body) {
    return true;
  }

  /**
   *  Returns the fields & headers to send to the tracker for login
   *  Needs to be overridden with each tracker's specific fields
   */
  _getLoginData() {
    return Promise.resolve({
      'method': '', // POST, GET
      'fields': {

      },
      'headers': {

      }
    });
  }

  /**
   *  Returns the fields & headers to send to the tracker for search
   *  Needs to be overridden with each tracker's specific fields
   */
  _getSearchData(query, options) {
    return Promise.resolve({
      'method': '', // POST, GET
      'fields': {

      },
      'headers': {

      }
    });
  }

  /**
   *  Returns details to parse the search results
   *  Needs to be overridden with each tracker's specific fields
   */
  _getParseData() {
    return Promise.resolve({
      'item': '',
      'detailsLink': '',
      'title': '',
      'size': '',
      'seeders': '',
      'leechers': '',
      'data': {
        'field': {
          'selector': '',
          'regex': ''
        }
      }
    });
  }

  /**
   *  Returns the fields & headers to send to the tracker for download
   *  Needs to be overridden with each tracker's specific fields
   */
  _getDownloadData(torrent) {
    return Promise.resolve({
      'method': '', // POST, GET
      'fields': {

      },
      'headers': {

      }
    });
  }
};

module.exports = Tracker;
