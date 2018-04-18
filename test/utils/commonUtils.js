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
const sanitize = commonUtils.sanitize;
const config = require('../../src/config/config');

describe('test/utils/commonUtils.js >', () => {
  describe('isBulk >', () => {
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
  });

  describe('sanitize >', () => {
    it('should not sanitize when keys are not passed as array', (done) => {
      const obj = {
        token: 'a310u',
        username: 'refocus-collector-user',
      };
      const sanitized = sanitize(obj, 'token');
      expect(sanitized.token).to.equal(obj.token);
      done();
    });

    it('ok, sanitize with a single key', (done) => {
      const obj = {
        token: 'a310u',
        username: 'refocus-collector-user',
      };
      const sanitized = sanitize(obj, ['token']);
      expect(sanitized.token).to.contain('...');
      expect(sanitized.token.length).to.not.equal(obj.token.length);
      expect(sanitized.username).to.equal(obj.username);
      done();
    });

    it('ok, sanitize with multiple keys and nested objects', (done) => {
      const obj = {
        accessToken: 'a310u',
        username: 'refocus-collector-user',
        bearerToken: 'b3ar3r',
        somethingNested: {
          a: 1,
          b: [3, 4, 5],
          bearerToken: 'qwertyuiop',
          anotherToken: '1234567890123456789012345678901234567890',
        },
      };
      const sanitized = sanitize(obj,
        ['accessToken', 'bearerToken', 'anotherToken']);
      expect(sanitized).to.deep.equal({
        accessToken: '...a310u',
        username: 'refocus-collector-user',
        bearerToken: '...3ar3r',
        somethingNested: {
          a: 1,
          b: [3, 4, 5],
          bearerToken: '...yuiop',
          anotherToken: '...67890',
        },
      });
      done();
    });
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
      config.initializeConfig();
      const existing = config.getConfig().metadata;
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
      config.initializeConfig();
      const existing = config.getConfig().metadata;
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
