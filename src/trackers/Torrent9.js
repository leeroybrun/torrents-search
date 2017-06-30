const Tracker = require('../tracker');

const urlify = require('urlify').create({
  spaces: '-',
  nonPrintable: '-',
  trim: true,
  toLower: true
});

class Torrent9 extends Tracker {
  constructor(options) {
    super(options);

    const baseUrl = 'http://www.torrent9.cc';

    this.setBaseInfos({
      name: 'Torrent9',

      baseUrl: baseUrl,
      endpoints: {
        home:       baseUrl +'/',
        search:     baseUrl +'/search_torrent/{query}.html,trie-seeds-d',
        searchCat:  baseUrl +'/search_torrent/{cat}/{query}.html,trie-seeds-d',
        download:   baseUrl +'/get_torrent'
      },

      cats: {
        movies: 'films',
        tvshows: 'series',
        music: 'musique',
        softwares: 'logiciels',
        books: 'ebook'
      }
    });
  }

  _getParseData() {
    return Promise.resolve({
      item: 'table.table tbody > tr',
      fields: {
        id: 'a@href | regex:\/(?<id>[^.\/]+)$:id',
        detailsUrl: 'a@href',
        name: 'a',
        size: 'td:nth-child(2) | parseSizeToBytes',
        seeders: '.seed_ok',
        leechers: 'td:nth-child(4)'
      },
      data: {},
      paginateSelector: 'a:has(strong:contains(Suiv))@href'
    });
  }

  _getDownloadData(torrent) {
    return Promise.resolve({
      method: 'GET',
      url: this._endpoints.download +'/'+ urlify(torrent.name) +'.torrent',
      fields: {},
      headers: {
        'Referer': this.baseUrl +'/',
      }
    });
  }
}

module.exports = Torrent9;
