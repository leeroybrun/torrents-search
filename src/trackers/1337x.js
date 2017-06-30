const Tracker = require('../tracker');

class _1337x extends Tracker {
  constructor(options) {
    super(options);

    const baseUrl = 'http://www.1337x.to';

    this.setBaseInfos({
      name: '1337x',

      baseUrl: baseUrl,
      endpoints: {
        home:       baseUrl +'/',
        search:     baseUrl +'/search/{query}/1/',
        searchCat:  baseUrl +'/category-search/{query}/{cat}/1/',
      },

      cats: {
        movies: 'Movies',
        tvshows: 'TV',
        music: 'Music',
        software: 'Apps',
        books: null
      }
    });
  }

  _getParseData() {
    return Promise.resolve({
      item: 'tbody > tr',
      fields: {
        id: 'a:nth-child(2)@href | regex:\/(?<id>[^.\/]+)\/$:id',
        detailsUrl: 'a:nth-child(2)@href',
        name: 'a:nth-child(2)',
        size: '.size@html | until:<sp | parseSizeToBytes',
        seeders: '.seeds',
        leechers: '.leeches'
      },
      data: {},
      paginateSelector: '.pagination li:nth-last-child(2) a@href'
    });
  }

  _getDownloadData(torrent) {
    return new Promise((resolve, reject) => {
      this._x(torrent.detailsUrl, '.infohash-box span')((err, hash) => {
        if(err) {
          return reject(err);
        }

        return resolve({
          'method': 'GET',
          'url': 'http://itorrents.org/torrent/'+ hash +'.torrent',
          'fields': {},
          'headers': this._defaultHeaders
        });
      });
    });
  }
}

module.exports = _1337x;
