import Tracker from '../Tracker';

class Smartorrent extends Tracker {
  constructor(options) {
    super(options);

    this.name = 'Smartorrent';

    this.baseUrl = 'http://www.smartorrent.com';
    this._urls = {
      home:       this.baseUrl +'/',
      login:      this.baseUrl +'/dispatcheur.php?op=user_login&login_remember=on',
      loginCheck: this.baseUrl +'/',
      search:     this.baseUrl +'/?page=search&ordre=sd',
      download:   this.baseUrl +'/?page=download'
    };

    this._cats = {
      movie: {
        'cat': 11
      },
      tvshow: {}
    };
  }

  _checkLoginSuccess(body) {
    return (body.indexOf('page=abonnement') != -1);
  }

  _getLoginData() {
    return Promise.resolve({
      method: 'POST',
      fields: {
        'login_username': this._login.username,
        'login_password': this._login.password,
        'op': 'user_login',
        'login_remember': 'on'
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
        'page': 'search',
        'ordre': 'sd',
        'term': query
      },
      headers: {
        'Referer': this.baseUrl +'/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive'
      }
    });
  }

  _getParseData(callback) {
    return Promise.resolve({
      item: 'table#parcourir tbody tr',
      detailsLink: 'td.nom div+a',
      title: 'td.nom div+a',
      size: 'td.taille',
      seeders: 'td.seed',
      leechers: 'td.leech',
      data: {
        'id': {
          selector: 'td.nom div+a',
          regex: '/([0-9]+)/'
        }
      }
    });
  }

  _getDownloadData(torrent, callback) {
    return Promise.resolve({
      method: 'GET',
      fields: {
        'page': 'download',
        'tid': torrent.data.id
      },
      headers: {
        'Referer': this.baseUrl +'/',
      }
    });
  }
}

module.exports = Smartorrent;
