class Torrent {
  constructor(data) {
    this.detailsUrl = data.detailsUrl || null;
    this.name = data.name || null;
    this.size = data.size || null;
    this.seeders = (data.seeders) ? parseInt(data.seeders) : 0;
    this.leechers = (data.leechers) ? parseInt(data.leechers) : 0;
    this.tracker = data.tracker || null;
    this._tracker = data._tracker || null;
    this.data = data.data || {};

    // Parse torrent name to get informations about quality, etc
    this.infos = parseTorrentName(this.name);
  }

  download() {
    return this.tracker.download(this);
  }
}
