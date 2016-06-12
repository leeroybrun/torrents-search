'use babel';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import extend from 'extend';

import TorrentsSearch from '../src/torrents-search';
import TrackerMock from './mock/tracker.mock';

const expect = chai.expect;
chai.use(chaiAsPromised);

describe('TorrentsSearch', () => {
  it('should be able to setup the provider with a right API key', function() {
    this.timeout(3000);
    this.slow(3000);

    const tmdb = new TmdbProvider(AppMock);

    return expect(tmdb.setup()).to.be.fulfilled;
  });

  it('should not be able to setup the provider with a wrong API key', function() {
    this.slow(1500);

    const AppMockWrongApiKey = extend(true, {}, AppMock, {
      config: {
        registry: {
          tmdb: { apiKey: 'wrongApiKey' }
        }
      }
    });

    const tmdb = new TmdbProvider(AppMockWrongApiKey);

    return expect(tmdb.setup()).to.be.rejected;
  });
});
