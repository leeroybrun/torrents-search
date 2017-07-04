'use strict';

const request = require('request');
const cheerio = require('cheerio');
const extend = require('extend');

const urlify = require('urlify').create({
  spaces: '-',
  nonPrintable: '-',
  trim: true,
  toLower: true
});

const format = require('string-format');

const Xray = require('x-ray');
const makeRequestDriver = require('request-x-ray');

const filters = require('./filters');
const Torrent = require('./torrent');

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
    this.loginRequired = false;

    this._endpoints = {
      'home':       '',
      'login':      '',
      'loginCheck': '',
      'search':     '',
      'searchCat':  '',
      'download':   ''
    };

    this._cats = {
      movie: null,
      tvshow: null,
      music: null,
      software: null,
      books: null
    };

    this._login = {
      status: false,
      lastLogin: 0,
      username: '',
      password: ''
    };

    this._defaultHeaders = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31'
    };

    this._cookies = request.jar();

    this._x = Xray({ filters });
        
    this._x.driver(makeRequestDriver({
      method: 'GET',
      jar: this._cookies,
      headers: this._defaultHeaders
    }));
  }

  setBaseInfos(infos) {
    if('name' in infos) {
      this.name = infos.name;
    }

    if('baseUrl' in infos) {
      this.baseUrl = infos.baseUrl;
    }
    
    if('loginRequired' in infos) {
      this.loginRequired = infos.loginRequired;
    }
    
    if('endpoints' in infos) {
      this._endpoints = extend(this._endpoints, infos.endpoints);
    }
    
    if('cats' in infos) {
      this._cats = extend(this._cats, infos.cats);
    }
  }

  /*********************************************************
   * Public methods
   ********************************************************/

  /**
   *  Set credentials for the tracker
   */
  setCredentials(username, password) {
    this._login.username = username;
    this._login.password = password; // TODO: find more secure way to store password?
  }

  /**
   *  Check if we are logged in on tracker
   *      - Last login < 5 mins ago -> we presume we are logged in
   *      - Last login > 5 mins ago -> we fetch the tracker's "loginCheck" url and checkLoginSuccess
   */
  isLogged() {
    // Check if already logged in less than 5 minutes ago
    if(!this.loginRequired || (this._login.status && (Date.now() - this._login.lastLogin) < 300000)) {
      return Promise.resolve(true);
    }

    // If not logged in or more than 5 minutes ago, we presume that we are not logged anymore and we need to check again
    this._login.status = false;

    return this._request({ url: this._endpoints.loginCheck, method: 'GET' }).then((body) => {
      if(!this._checkLoginSuccess(body)) {
        return Promise.resolve(false);
      }

      this._login.status = true;
      this._login.lastLogin = Date.now();

      return true;
    });
  }

  /**
   *  Check if we are logged in on the tracker, and if not -> do the login
   */
  login() {
    return new Promise((resolve, reject) => {
      this.isLogged().then((status) => {
        if(status === true) {
          return resolve(); // We are already logged in
        }

        this._getLoginData().then((data) => {
          return this._request({
            url: ('url' in data) ? data.url : this._endpoints.login,
            method: data.method,
            form: data.fields,
            headers: data.headers
          });
        }).then((body) => {
          if(!this._endpoints.loginCheck) {
            return Promise.resolve(body);
          }

          return this._request({ url: this._endpoints.loginCheck, method: 'GET' });
        }).then((body) => {
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
      }).catch((reason) => {
        return reject(reason);
      });
    });
  }

  _getSearchUrl(query, options) {
    // Category (type) defined in the options, use category search URL
    if(options.type && this._cats[options.type]) {
      return format(this._endpoints.searchCat, {
        query: urlify(query), // URLEncode instead of urlify?
        cat: this._cats[options.type]
      });
    // No type/category defined, use main search URL
    } else {
      return format(this._endpoints.search, {
        query: urlify(query)
      });
    }
  }

  /**
   *  Search for torrents on the tracker
   */
  search(text, options) {
    if (typeof text === 'undefined') {
      return Promise.reject(new Error('Please provide a text to search.'));
    }

    options = options || {};
    options.type = options.type || null;
    options.limit = options.limit || 1;

    return this.login()
      .then(() => {
        return this._getSearchData(text, options);
      })
      .then((data) => {
        const url = (data.url) ? data.url : this._getSearchUrl(text, options);

        return this._search(url, options.limit);
      });
  }

  _processSearchResults(results, parseData) {
    return results.map(r => {
      const torrent = new Torrent({
        id: r.id || null,
        detailsUrl: (r.detailsUrl) ? this._getAbsoluteUrl(r.detailsUrl) : null,
        name: r.name || null,
        size: r.size || null,
        seeders: (r.seeders) ? parseInt(r.seeders) : null,
        leechers: (r.leechers) ? parseInt(r.leechers) : null,
        _tracker: this,
        tracker: this.name,
        data: {}
      });

      Object.keys(parseData.data).forEach((dataKey) => {
        torrent.data[dataKey] = r[dataKey];
      });

      return torrent;
    });
  }

  _search(url, limit) {
    return this._getParseData().then((parseData) => {
      const fields = extend({}, parseData.fields, parseData.data);

      return new Promise((resolve, reject) => {
        this._x(url, parseData.item, [fields])
          .paginate(parseData.paginateSelector)
          .limit(limit)
          ((err, results) => {
            if(err) {
              return reject(err);
            }

            return resolve(this._processSearchResults(results, parseData));
          });
      });
    });
  }

  _getAbsoluteUrl(url) {
    var r = new RegExp('^(?:[a-z]+:)?//', 'i');
    if(r.test(url) === false) {
      url = this.baseUrl + ((url.indexOf('/') !== 0) ? '/' : '') + url;
    }

    return url;
  }

  /**
   *  Download a .torrent on the specified tracker
   */
  download(torrent) {
    return this.login()
      .then(() => {
        return this._getDownloadData(torrent);
      })
      .then((data) => {
        return this._request({
          url: ('url' in data) ? data.url : this._endpoints.download,
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
  _request(options) {
    // Headers not set in the options, create empty object
    if(!('headers' in options) || typeof options.headers !== 'object') {
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
  _checkLoginSuccess(body) {
    /*jshint unused:false*/
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
    /*jshint unused:false*/
    return Promise.resolve({
      url: null
    });
  }

  /**
   *  Returns details to parse the search results
   *  Needs to be overridden with each tracker's specific fields
   */
  _getParseData() {
    return Promise.resolve({
      'item': '',
      fields: {
        id: '',
        detailsUrl: '',
        name: '',
        size: '',
        seeders: '',
        leechers: ''
      },
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
    /*jshint unused:false*/
    return Promise.resolve({
      'method': '', // POST, GET
      'fields': {

      },
      'headers': {

      }
    });
  }
}

module.exports = Tracker;
