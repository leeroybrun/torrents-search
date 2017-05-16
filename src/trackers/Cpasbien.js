import Tracker from '../Tracker';

const urlify = require('urlify').create({
  spaces: '-',
  nonPrintable: '-',
  trim: true,
  toLower: true
});

class Cpasbien extends Tracker {
  constructor(options) {
    super(options);

    this.name = 'Cpasbien';

    this.baseUrl = 'http://cpasbien.xyz';
    this._endpoints = {
      home:       this.baseUrl +'/',
      search:     this.baseUrl +'/recherche',
      download:   this.baseUrl +'/telechargement'
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
        'Referer': this.baseUrl +'/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Connection': 'keep-alive'
      }
    });
  }

  _getParseData() {
    return Promise.resolve({
      item: '.ligne0, .ligne1',
      fields: {
        id: ['a.titre', 'href', '\/(?<id>[^.\/]+)\.(?=[^.]*$)'],
        detailsUrl: ['a.titre', 'href'],
        name: 'a.titre',
        size: '.poid',
        seeders: '.up .seed_ok',
        leechers: '.down'
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

module.exports = Cpasbien;
