import Tracker from '../Tracker';

class T411 extends Tracker {
  constructor(options) {
    super(options);

    this.name = 't411';

    this.baseUrl = 'http://www.t411.ch';
    this._urls = {
      home:       this.baseUrl +'/',
      login:      this.baseUrl +'/users/auth/',
      loginCheck: this.baseUrl +'/',
      search:     this.baseUrl +'/torrents/search/',
      download:   this.baseUrl +'/torrents/download/'
    };

    this._cats = {
      'movie': {
        'cat': '210',
        'subcat': '631',
        'term[17][]': '541'
      },
      'tvshow': {}
    };
  }

  _checkLoginSuccess(body) {
    return (body.indexOf('"status":"OK"') != -1);
  }

  _getLoginData() {
    return Promise.resolve({
      method: 'POST',
      fields: {
        'login': this._login.username,
        'password': this._login.password,
        'url': '/',
        'remember': '1'
      },
      headers: {
        'Referer': this.baseUrl +'/',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
        'Connection': 'keep-alive'
      }
    });
  }

  _getSearchData(query, options) {
    return Promise.resolve({
      method: 'GET',
      fields: {
        'submit': 'Recherche',
        'order': 'seeders',
        'type': 'desc',
        'search': query
      },
      headers: {
        'Referer': this.baseUrl +'/torrents/search/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive'
      }
    });
  }

  _getParseData(callback) {
    return Promise.resolve({
      item: 'table.results tbody tr',
      detailsLink: 'td+td a:first-child',
      title: 'td+td a:first-child',
      size: 'td+td+td+td+td+td',
      seeders: 'td+td+td+td+td+td+td+td',
      leechers: 'td+td+td+td+td+td+td+td+td',
      data: {
        'id': {
          selector: 'td+td+td a',
          regex: 'id=([0-9]+)'
        }
      }
    });
  }

  _getDownloadData(torrent, callback) {
    return Promise.resolve({
      method: 'GET',
      fields: {
        'id': torrent.data.id
      },
      headers: {
        'Referer': this.baseUrl +'/',
      }
    });
  }
}

module.exports = T411;
