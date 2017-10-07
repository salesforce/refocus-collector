/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/commonUtils.js
 */
const expect = require('chai').expect;
const commonUtils = require('../../src/utils/commonUtils');
const config = require('../../src/config/config');

describe('test/utils/commonUtils.js - common utils unit tests >', () => {
  it('readFile async, success', (done) => {
    commonUtils.readFileAsynchr('./test/utils/fileToRead.txt', 'utf8')
    .then((data) => {
      expect(data).to.be.equal(
        'This is a text file meant to test the readFile function in ' +
        'commonUtils.'
      );
    })
    .then(() => done())
    .catch(done);
  });

  it('readFile async, file not found', (done) => {
    commonUtils.readFileAsynchr('./test/utils/FileDoesNotExist.txt', 'utf8')
    .catch((err) => {
      expect(err.status).to.be.equal(404);
      expect(err.name).to.be.equal('ResourceNotFoundError');
      expect(err.message).to.be.equal(
        'File: ./test/utils/FileDoesNotExist.txt not found'
      );
    })
    .then(done)
    .catch(done);
  });

  it('readFile sync, success', (done) => {
    const data = commonUtils.readFileSynchr('./test/utils/fileToRead.txt');
    expect(data).to.be.equal(
      'This is a text file meant to test the readFile function in ' +
      'commonUtils.'
    );
    done();
  });

  it('readFile sync, file not found', (done) => {
    const fn = commonUtils.readFileSynchr.bind(
      commonUtils, './test/utils/NotExist.txt'
    );
    expect(fn).to.throw('File: ./test/utils/NotExist.txt not found');
    done();
  });

  it('isBulk', (done) => {
    const gen = {
      generatorTemplate: {
        connection: {
          bulk: true,
        },
      },
    };
    expect(commonUtils.isBulk(gen)).to.be.true;
    gen.generatorTemplate.connection.bulk = false;
    expect(commonUtils.isBulk(gen)).to.be.false;
    delete gen.generatorTemplate.connection.bulk;
    expect(commonUtils.isBulk(gen)).to.be.false;
    delete gen.generatorTemplate.connection;
    expect(commonUtils.isBulk(gen)).to.be.false;
    delete gen.generatorTemplate;
    expect(commonUtils.isBulk(gen)).to.be.false;
    done();
  });

  describe('collector metadata >', () => {

    it('getCurrentMetadata()', (done) => {
      const metadata = commonUtils.getCurrentMetadata();

      expect(metadata).to.be.an('object');

      const osKeys = ['arch', 'hostname', 'platform', 'release', 'type', 'username'];
      expect(metadata.osInfo).to.be.an('object');
      expect(metadata.osInfo).to.have.all.keys(osKeys);
      expect(metadata.osInfo.arch).to.be.a('string');
      expect(metadata.osInfo.hostname).to.be.a('string');
      expect(metadata.osInfo.platform).to.be.a('string');
      expect(metadata.osInfo.release).to.be.a('string');
      expect(metadata.osInfo.type).to.be.a('string');
      expect(metadata.osInfo.username).to.be.a('string');

      const processKeys = ['execPath', 'memoryUsage', 'uptime', 'version', 'versions'];
      expect(metadata.processInfo).to.be.an('object');
      expect(metadata.processInfo).to.have.all.keys(processKeys);
      expect(metadata.processInfo.execPath).to.be.a('string');

      const memoryUsageKeys = ['rss', 'heapTotal', 'heapUsed'];
      expect(metadata.processInfo.memoryUsage).to.be.an('object');
      expect(metadata.processInfo.memoryUsage).to.include.all.keys(memoryUsageKeys);
      expect(metadata.processInfo.memoryUsage.rss).to.be.a('number');
      expect(metadata.processInfo.memoryUsage.heapTotal).to.be.a('number');
      expect(metadata.processInfo.memoryUsage.heapUsed).to.be.a('number');
      if (metadata.processInfo.memoryUsage.external) {
        expect(metadata.processInfo.memoryUsage.external).to.be.a('number');
      }

      expect(metadata.processInfo.uptime).to.be.a('number');
      expect(metadata.processInfo.version).to.be.a('string');
      expect(metadata.processInfo.versions).to.be.an('object');
      Object.keys(metadata.processInfo.versions).forEach((key) => {
        expect(metadata.processInfo.versions[key]).to.be.a('string');
      });

      expect(metadata.version).to.be.a('string');
      done();
    });

    it('getChangedMetadata() - no changes', (done) => {
      config.setRegistry({});
      const existing = config.getConfig().collectorConfig;
      const current = {
        osInfo: existing.osInfo,
        processInfo: existing.processInfo,
        version: existing.version,
      };

      const changed = commonUtils.getChangedMetadata(existing, current);
      expect(changed).to.be.an('object');
      expect(changed).to.be.empty;
      done();
    });

    it('getChangedMetadata() - changes', (done) => {
      config.setRegistry({});
      const existing = config.getConfig().collectorConfig;
      const osInfo = JSON.parse(JSON.stringify(existing.osInfo));
      const processInfo = JSON.parse(JSON.stringify(existing.processInfo));
      const version = existing.version;
      const current = {
        osInfo,
        processInfo,
        version,
      };

      current.osInfo.arch = 'changed';
      current.processInfo.memoryUsage.heapTotal = 1;
      current.processInfo.version = 'changed';
      current.version = 'changed';
      const changed = commonUtils.getChangedMetadata(existing, current);

      expect(changed).to.be.an('object');
      expect(changed).to.have.all.keys('osInfo', 'processInfo', 'version');

      expect(changed.osInfo).to.exist;
      expect(changed.osInfo).to.be.an('object');
      expect(changed.osInfo).to.have.all.keys('arch');
      expect(changed.osInfo.arch).to.equal('changed');

      expect(changed.processInfo).to.exist;
      expect(changed.processInfo).to.have.all.keys('memoryUsage', 'version');
      expect(changed.processInfo.memoryUsage).to.have.all.keys('heapTotal');
      expect(changed.processInfo.memoryUsage.heapTotal).to.equal(1);
      expect(changed.processInfo.version).to.equal('changed');

      expect(changed.version).to.equal('changed');

      done();
    });

  });
});
