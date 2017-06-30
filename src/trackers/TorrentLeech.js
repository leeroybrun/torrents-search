const Tracker = require('../tracker');

const format = require('string-format');

class TorrentLeech extends Tracker {
  constructor(options) {
    super(options);

    const baseUrl = 'https://www.torrentleech.org';

    this.setBaseInfos({
      name: 'TorrentLeech',

      loginRequired: true,

      baseUrl: baseUrl,
      endpoints: {
        home: baseUrl + '/',
        login: baseUrl + '/user/account/login/',
        loginCheck: baseUrl +'/',
        search: baseUrl + '/torrents/browse/index/query/{query}/newfilter/2/orderby/seeders/order/desc',
        searchCat: baseUrl + '/torrents/browse/index/query/{query}/newfilter/2/facets/category%253A{cat}/orderby/seeders/order/desc',
        download: baseUrl + '/download/{trackerId}/{dlFileName}.torrent'
      },

      cats: {
        movies: 'Movies',
        tvshows: 'TV',
      },
    });
  }

  _getLoginData() {
    return Promise.resolve({
      method: 'POST',
      fields: {
        username: this._login.username,
        password: this._login.password,
      },
      headers: {
        referer: this._endpoints.login,
      },
    });
  }

  _checkLoginSuccess(pageHtml) {
    return pageHtml.indexOf('title="Logout" href="/user/account/logout"') !== -1;
  }

  _getParseData() {
    return Promise.resolve({
      item: '#torrenttable tbody > tr',
      fields: {
        id: '@id',
        detailsUrl: '.name .title a@href',
        name: '.name .title',
        date: '.addedInLine@html | since:" on " | trim | toDate',
        size: 'td:nth-child(5) | parseSizeToBytes',
        seeders: '.seeders',
        leechers: '.leechers',
      },
      data: {
        trackerId: '@id',
        dlFileName: '.quickdownload a@href | regex:\/(?<id>[^\/]+)$:id'
      },
      paginateSelector: 'a.pagnext@href',
    });
  }

  _getDownloadData(torrent) {
    return Promise.resolve({
      method: 'GET',
      url: format(this._endpoints.download, { 
        trackerId: torrent.data.trackerId, 
        dlFileName: torrent.data.dlFileName
      }),
      fields: {},
      headers: {
        Referer: this.baseUrl + '/',
      },
    });
  }
}

module.exports = TorrentLeech;
