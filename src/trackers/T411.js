import T411Client from 't411';
import extend from 'extend';

import Tracker from '../Tracker';
import Torrent from '../torrent';

class T411 extends Tracker {
  constructor(options) {
    super(options);

    this.name = 't411';

    this.baseUrl = 'http://www.t411.al';

    this.loginRequired = true;

    this.client = new T411Client();

    this._cats = {
      'movie': {
        'cid': 631
      },
      'tvshow': {
        'cid': 433
      }
    };
  }

  // TODO: retry request when token/auth error?
  errorHandler(err) {
    // Token errors
    if(err.code === 202 || err.code === 201) {
      this._login.status = false;
    }
  }

  isLogged() {
    // Check if already logged in less than 50 minutes ago
    if(this._login.status && (Date.now() - this._login.lastLogin) < 3000000) {
      return Promise.resolve(true);
    }

    if(this.client.token) {
      this._login.status = true;
      this._login.lastLogin = Date.now();
      return Promise.resolve(true);
    }

    this._login.status = false;
    return Promise.resolve(false);
  }

  /**
   *  Check if we are logged in on the tracker, and if not -> do the login
   */
  login() {
    return new Promise((resolve, reject) => {
      this.isLogged().then((isLogged) => {
        if(isLogged) {
          return resolve();
        }

        this.client.auth(this._login.username, this._login.password, (err) => {
          if(err) {
            this.errorHandler(err);
            return reject(err);
          }

          this._login.status = true;
          this._login.lastLogin = Date.now();

          return resolve();
        });
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

    if(this._cats[options.type]) {
      extend(options, this._cats[options.type]);
    }

    return new Promise((resolve, reject) => {
      this.login().then(() => {
        this.client.search(text, options, (err, result) => {
          if(err) {
            this.errorHandler(err);
            return reject(err);
          }

          return resolve(this.parse(result));
        });
      }).catch((reason) => {
        return reject(reason);
      });
    });
  }

  /**
   *  Parse tracker's search page results
   */
  parse(result) {
    const torrents = [];

    result.torrents.forEach((torrent) => {
      torrents.push(new Torrent({
        //detailsUrl: $torrentEl.find(parseData.detailsLink).eq(0).attr('href').trim(),
        id: torrent.id,
        name: torrent.name,
        size: (parseFloat(torrent.size) / 1000 / 1000).toFixed(2),
        seeders: parseInt(torrent.seeders),
        leechers: parseInt(torrent.leechers),
        _tracker: this,
        tracker: this.name,
        data: {
          id: torrent.id
        }
      }));
    });

    return torrents;
  }

  /**
   *  Download a .torrent on the specified tracker
   */
  download(torrent) {
    return new Promise((resolve, reject) => {
      this.login().then(() => {
        this.client.download(torrent.data.id, (err, buf) => {
          if(err) {
            this.errorHandler(err);
            return reject(err);
          }

          return resolve(buf);
        });
      }).catch((reason) => {
        return reject(reason);
      });
    });
  }
}

module.exports = T411;
