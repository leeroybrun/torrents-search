import Tracker from '../Tracker';
import cheerio from 'cheerio';

class Frenchtorrentdb extends Tracker {
  constructor(options) {
    super(options);

    this.name = 'FrenchTorrentDB';

    this.baseUrl = 'http://www.frenchtorrentdb.net';
    this._urls = {
      home:       this.baseUrl +'/',
      login:      this.baseUrl +'/account-login.php',
      loginCheck: this.baseUrl +'/',
      search:     this.baseUrl +'/',
      download:   this.baseUrl +'/'
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
    return (body.indexOf('account-logout.php') != -1);
  }

  _getLoginData() {
    return {
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
    };
  },

  _getSearchData(query, options, callback) {
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
  },

  _getParseData() {
    return Promise.resolve({
      item: '.results_index .DataGrid ul',
      detailsLink: 'a.torrents_name_link',
      title: 'a.torrents_name_link',
      size: 'li.torrents_size',
      seeders: 'li.torrents_seeders',
      leechers: 'li.torrents_leechers',
      data: {
        'id': {
          selector: 'li.torrents_download a',
          regex: '(&|&amp;)id=([0-9]+)'
        },
        'uid': {
          selector: 'li.torrents_download a',
          regex: '(&|&amp;)uid=([0-9]+)'
        },
        'hash': {
          selector: 'li.torrents_download a',
          regex: '(&|&amp;)hash=([a-z0-9]+)'
        }
      }
    });
  }

  _getDownloadData(torrent) {
    return Promise.resolve({
      method: 'GET',
      fields: {
        'section': 'DOWNLOAD',
        'id': torrent.data.id,
        'uid': torrent.data.uid,
        'hash': torrent.data.hash
      },
      headers: {
        'Referer': this.baseUrl
      }
    });
  }
}

module.exports = Frenchtorrentdb;
