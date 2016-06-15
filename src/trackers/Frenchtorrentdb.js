import Tracker from '../Tracker';

class Frenchtorrentdb extends Tracker {
  constructor(options) {
    super(options);

    this.name = 'FrenchTorrentDB';

    this.loginRequired = true;

    this.baseUrl = 'http://www.frenchtorrentdb.net';
    this._endpoints = {
      home:       this.baseUrl +'/index.php',
      login:      this.baseUrl +'/account-login.php',
      loginCheck: this.baseUrl +'/index.php',
      search:     this.baseUrl +'/torrents-search.php',
      download:   this.baseUrl +'/download.php'
    };

    this._cats = {
      movie: {
        'c54': 1, 'c53': 1, 'c91': 1, 'c88': 1, 'c49': 1, 'c48': 1,
        'c51': 1, 'c50': 1, 'c95': 1, 'c87': 1, 'c52': 1, 'cat': 0
      },
      tvshow: {
        'c92': 1, 'c93': 1, 'c65': 1, 'c94': 1, 'c59': 1, 'c61': 1,
        'c64': 1, 'c58': 1, 'c62': 1, 'c63': 1, 'c60': 1
      }
    };
  }

  _checkLoginSuccess(body) {
    return (body.indexOf('account-logout.php') !== -1);
  }

  _getLoginData() {
    return Promise.resolve({
      method: 'POST',
      fields: {
        'username': this._login.username,
        'password': this._login.password,
        'returnto': '/index.php'
      },
      headers: {
        'Referer': this.baseUrl +'/account-login.php?returnto=%2Findex.php',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Connection': 'keep-alive'
      }
    });
  }

  _getSearchData(query) {
    return Promise.resolve({
      method: 'GET',
      fields: {
        'search': query,
        'incldead': 0,
        'freeleech': 0,
        'lang': 0
      },
      headers: {
        'Referer': this.baseUrl +'/?section=TORRENTS',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive'
      }
    });
  }

  _getParseData() {
    return Promise.resolve({
      item: 'table.ttable_headinner tr.t-row',
      fields: {
        detailsUrl: ['td:nth-child(2) a', 'href'],
        name: ['td:nth-child(2) a', 'title'],
        size: 'td:nth-child(6)',
        seeders: 'td:nth-child(7)',
        leechers: 'td:nth-child(8)'
      },
      data: {
        'id': {
          selector: 'td:nth-child(3) a',
          attr: 'href',
          regex: '(&|&amp;|\\?)id=(?<id>[0-9]+)'
        },
        'filename': {
          selector: 'td:nth-child(3) a',
          attr: 'href',
          regex: '(&|&amp;)name=(?<filename>[a-zA-Z0-9_% .-]+)'
        }
      }
    });
  }

  _getDownloadData(torrent) {
    return Promise.resolve({
      method: 'GET',
      fields: {
        'id': torrent.data.id,
        'name': torrent.data.filename
      },
      headers: {
        'Referer': this.baseUrl
      }
    });
  }
}

module.exports = Frenchtorrentdb;
