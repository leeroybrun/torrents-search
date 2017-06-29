const TorrentNameParser = require('torrent-name-parse');

const parser = new TorrentNameParser();

class Torrent {
  constructor(data) {
    this.id = (data.id) ? `${data.tracker.toLowerCase()}-${String(data.id).toLowerCase()}` : null; // ID field is trackername-torrentid
    this.detailsUrl = data.detailsUrl || null;
    this.name = data.name || null;
    this.size = data.size || null;
    this.seeders = (data.seeders) ? parseInt(data.seeders) : 0;
    this.leechers = (data.leechers) ? parseInt(data.leechers) : 0;
    this.tracker = data.tracker || null;
    this._tracker = data._tracker || null;
    this.data = data.data || {};

    // Parse torrent name to get informations about quality, etc
    this.infos = (this.name) ? parser.parse(this.name) : {};
  }

  download() {
    return this._tracker.download(this);
  }
}

module.exports = Torrent;
