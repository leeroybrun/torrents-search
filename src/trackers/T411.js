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

  isLogged() {
    // Check if already logged in less than 5 minutes ago
    if(this._login.status && (Date.now() - this._login.lastLogin) < 300000) {
      return Promise.resolve(true);
    }

    // If not logged in or more than 5 minutes ago, we presume that we are not logged anymore and we need to check again
    this._login.status = false;

    // TODO: add check if logged in. Call a method and check for an eventual error
  }

  /**
   *  Check if we are logged in on the tracker, and if not -> do the login
   */
  login() {
    return new Promise((resolve, reject) => {
      this.client.auth(this._login.username, this._login.password, (err) => {
        if(err) {
          return reject(err);
        }

        return resolve();
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
      this.client.search(text, options, (err, result) => {
        if(err) {
          return reject(err);
        }

        return resolve(this.parse(result));
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
        size: torrent.size,
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
      this.client.download(torrent.data.id, (err, buf) => {
        if(err) {
          return reject(err);
        }

        return resolve(buf);
      });
    });
  }
}

module.exports = T411;
