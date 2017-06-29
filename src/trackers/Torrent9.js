import Tracker from '../Tracker';

const urlify = require('urlify').create({
  spaces: '-',
  nonPrintable: '-',
  trim: true,
  toLower: true
});

class Torrent9 extends Tracker {
  constructor(options) {
    super(options);

    this.name = 'Torrent9';

    this.baseUrl = 'http://www.torrent9.cc';
    this._endpoints = {
      home:       this.baseUrl +'/',
      search:     this.baseUrl +'/search_torrent',
      download:   this.baseUrl +'/get_torrent'
    };
  }

  _getSearchData(query, options) {
    let url = this._endpoints.search +'/';

    if('type' in options) {
      if(options.type === 'movie') {
        url += 'films/';
      } else if(options.type === 'tvshow') {
        url += 'series/';
      }
    }

    url += urlify(query) +'.html,trie-seeds-d';

    return Promise.resolve({
      method: 'GET',
      url: url,
      fields: {},
      headers: {
        'Referer': this.baseUrl +'/'
      }
    });
  }

  _getParseData() {
    return Promise.resolve({
      item: 'table.table tbody > tr',
      fields: {
        id: ['a', 'href', '\/(?<id>[^.\/]+)$'],
        detailsUrl: ['a', 'href'],
        name: 'a',
        size: 'td:nth-child(2)',
        seeders: '.seed_ok',
        leechers: 'td:nth-child(4)'
      },
      data: {}
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
