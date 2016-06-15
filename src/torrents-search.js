import fs from 'fs';
import path from 'path';
import events from 'events';

import defaultLogger from './logger';

class TorrentsSearch extends events.EventEmitter {
  constructor(options) {
    super();

    options = options || {};

    this.logger = options.logger || defaultLogger;

    this.options = {
        timeout: options.timeout || 10000
    };

    this.trackers = []; // Array of loaded trackers

    this.trackersDir = path.join(__dirname, 'trackers/');
  }

  getTrackers() {
    var trackers = {
      enabled: [],
      disabled: []
    };

    this.trackers.forEach((tracker) => {
      if(tracker.enabled === true) {
        trackers.enabled.push(tracker.name);
      } else {
        trackers.disabled.push(tracker.name);
      }
    });

    return trackers;
  }

  loadTrackers() {
    return new Promise((resolve, reject) => {
      fs.readdir(this.trackersDir, (err, files) => {
        if(err) {
          this.logger.error('Cannot load trackers from filesystem.', err);
          return reject(err);
        }

        files.forEach((file) => {
          var filePath = path.join(this.trackersDir, file);
          this.trackers.push(new (require(filePath))(this.options));
        });

        this.emit('trackers:loaded', this.trackers);

        resolve();
      });
    });
  }

  enableTracker(trackerName) {
    var tracker = this._findTracker(trackerName);

    if(tracker !== null) {
      tracker.enabled = true;

      this.emit('tracker:enabled', tracker);

      return true;
    } else {
      this.logger.error('['+trackerName+'] Cannot enable. Tracker not found.');
      return false;
    }
  }

  disableTracker(trackerName) {
    var tracker = this._findTracker(trackerName);

    if(tracker !== null) {
      tracker.enabled = false;

      this.emit('tracker:disabled', tracker);

      return true;
    } else {
      this.logger.error('['+trackerName+'] Cannot disable. Tracker not found.');
      return false;
    }
  }

  setCredentials(trackerName, username, password) {
    var tracker = this._findTracker(trackerName);
    if(tracker !== null) {
      tracker.setCredentials(username, password);
      return true;
    } else {
      this.logger.error('['+trackerName+'] Cannot set credentials. Tracker not found.');
      return false;
    }
  }

  login() {
    const promises = [];

    const loggedInTrackers = [];

    this.trackers.forEach((tracker) => {
      if(tracker.enabled === false) {
        return;
      }

      promises.push(new Promise((resolve) => {
        this.logger.info('['+tracker.name+'] Start login...');
        tracker.login().then(() => {
          this.logger.info('['+tracker.name+'] Logged in !');

          loggedInTrackers.push(tracker);

          this.emit('tracker:loginSuccess', tracker);

          return resolve();
        }).catch((reason) => {
          this.logger.error('['+tracker.name+'] Error during login process.', reason);

          this.emit('tracker:loginError', tracker);

          return resolve();
        });
      }));
    });

    return Promise.all(promises).then(() => {
      return loggedInTrackers;
    });
  }

  search(searchText, type) {
    return new Promise((resolve) => {
      const promises = [];

      let torrentsFound = [];

      this.login().then((loggedInTrackers) => {
        loggedInTrackers.forEach((tracker) => {
          this.logger.info('['+tracker.name+'] Starting search for "'+ searchText +'"...');

          promises.push(new Promise((resolve) => {
            tracker.search(searchText, type).then((torrents) => {
              if(torrents.length === 0) {
                this.logger.info('['+tracker.name+'] No torrent found for "'+ searchText +'".');
              } else {
                this.logger.info('['+tracker.name+'] '+ torrents.length +' torrent(s) found for "'+ searchText +'".');

                torrentsFound = torrentsFound.concat(torrents);

                this.emit('tracker:torrentsFound', torrents, tracker);
              }

              return resolve();
            }).catch((reason) => {
              this.logger.error('['+tracker.name+'] Error during search', reason);

              this.emit('tracker:torrentsSearchError', reason, tracker);

              return resolve();
            });
          }));
        });

        Promise.all(promises).then(() => {
          return resolve(torrentsFound);
        });
      });
    });
  }

  download(torrent) {
    return new Promise((resolve, reject) => {
      var tracker = this._findTracker(torrent.tracker);

      if(tracker !== null) {
        if(tracker.enabled) {
          return tracker.download(torrent);
        } else {
          this.logger.error('['+tracker.name+'] Cannot download torrent. Tracker not enabled.');
          return reject(new Error('Tracker not enabled.'));
        }
      } else {
        this.logger.error('['+tracker.name+'] Cannot download torrent. Tracker not found.');
        return reject(new Error('Tracker not found.'));
      }
    });
  }

  _findTracker(trackerName) {
    var tracker = null;

    this.trackers.forEach(function(t) {
      if(t.name === trackerName) {
        tracker = t;
      }
    });

    return tracker;
  }
}

module.exports = TorrentsSearch;
