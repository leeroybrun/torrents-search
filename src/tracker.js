import request from 'request';
import cheerio from 'cheerio';
import extend from 'extend';
import XRegExp from 'xregexp';

import Torrent from './torrent';

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
      'download':   ''
    };

    this._cats = {
      'movie': {},
      'tvshow': {}
    };

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

  /**
   *  Search for torrents on the tracker
   */
  search(text, options) {
    if (typeof text === 'undefined') {
      return Promise.reject(new Error('Please provide a text to search.'));
    }

    options = options || {};
    options.type = options.type || null;

    return this.login()
      .then(() => {
        return this._getSearchData(text, options);
      })
      .then((data) => {
        if(this._cats[options.type]) {
          data.fields = extend(data.fields, this._cats[options.type]);
        }

        return this._request({
          url: ('url' in data) ? data.url : this._endpoints.search,
          method: data.method,
          headers: data.headers,
          params: data.fields
        });
      })
      .then((body) => {
        return this.parse(body);
      });
  }

  _getFieldData($elm, fieldName, field) {
    let selector = null;
    let attr = null;
    let regex = null;

    // Field just a selector string
    if (typeof field === 'string') {
      selector = field;
    // Field is an array of ['selector', 'attribute', 'regexp']
    } else if (Array.isArray(field)) {
      selector    = field[0];
      attr        = (field[1]) ? field[1] : null;
      regex       = (field[2]) ? field[2] : null;
    // Field is an object of type {selector: 'selector', attr: 'attribute', re: 'regexp']
    } else if (typeof field === 'object') {
      selector    = field.selector;
      attr        = (field.attr) ? field.attr : null;
      regex       = (field.regex) ? field.regex : null;
    }

    if(!selector) {
      return null;
    }

    let $fieldElm = $elm.find(selector);

    if($fieldElm.length === 0) {
      return null;
    }

    $fieldElm = $fieldElm.eq(0);

    if(!$fieldElm) {
      return null;
    }

    let value = null;
    if(attr !== null) {
      if($fieldElm.attr(attr)) {
        value = $fieldElm.attr(attr).trim();
      }
    } else {
      value = $fieldElm.text().trim();
    }

    if(regex !== null) {
      regex = XRegExp(regex, 'ig');
      let matches = XRegExp.exec(value, regex);
      if(matches !== null && fieldName in matches && matches[fieldName]) {
        value = matches[fieldName].trim();
      }
    }

    return value;
  }

  _parseSizeToBytes(size) {
    size = (typeof size !== 'undefined' && size !== null) ? size : '0 MB';
    var sizeA = size.split(/\s{1}/); // size split into value and unit

    var newSize = null; // size converted to MB
    switch (sizeA[1].toUpperCase()) {
      case 'B':
      case 'BYTES':
      case 'O':
          newSize = (parseFloat(sizeA[0])).toFixed(2);
          break;
      case 'KB':
      case 'KO':
          newSize = (parseFloat(sizeA[0]) * 1000).toFixed(2);
          break;
      case 'MB':
      case 'MO':
          newSize = (parseFloat(sizeA[0]) * 1000 * 1000).toFixed(2);
          break;
      case 'GB':
      case 'GO':
          newSize = (parseFloat(sizeA[0]) * 1000 * 1000 * 1000).toFixed(2);
          break;
      case 'TB':
      case 'TO':
          newSize = (parseFloat(sizeA[0]) * 1000 * 1000 * 1000 * 1000).toFixed(2);
          break;
      default:
          return size;
    }

    return newSize;
  }

  _getAbsoluteUrl(url) {
    var r = new RegExp('^(?:[a-z]+:)?//', 'i');
    if(r.test(url) === false) {
      url = this.baseUrl + ((url.indexOf('/') !== 0) ? '/' : '') + url;
    }

    return url;
  }

  /**
   *  Parse tracker's search page results
   */
  parse(body) {
    return this._getParseData()
      .then((parseData) => {
        var $ = cheerio.load(body);
        var torrentsEl = $(parseData.item);

        // No torrents found
        if (torrentsEl.length === 0) {
          return [];
        }

        var torrents = [];

        torrentsEl.each((i, elem) => {
          var $torrentEl = $(elem);

          const fields = {};

          for(let key in parseData.fields) {
            fields[key] = this._getFieldData($torrentEl, key, parseData.fields[key]);
          }

          // Parse torrent infos
          var torrent = new Torrent({
            id: (fields.id) ? fields.id : null,
            detailsUrl: (fields.detailsUrl) ? this._getAbsoluteUrl(fields.detailsUrl) : null,
            name: (fields.name) ? fields.name : null,
            size: (fields.size) ? this._parseSizeToBytes(fields.size) : null,
            seeders: (fields.seeders) ? parseInt(fields.seeders) : null,
            leechers: (fields.leechers) ? parseInt(fields.leechers) : null,
            _tracker: this,
            tracker: this.name,
            data: {}
          });

          // Parse custom fields
          for(let key in parseData.data) {
            torrent.data[key] = this._getFieldData($torrentEl, key, parseData.data[key]);
          }

          torrents.push(torrent);
        });

        return torrents;
      });
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
