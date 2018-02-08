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
const hu = require('../../src/heartbeat/utils');
const sanitize = commonUtils.sanitize;
const config = require('../../src/config/config');

describe('test/utils/commonUtils.js - common utils unit tests >', () => {
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

  describe('sanitize', () => {
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

    it('ok, sanitize with multiple key', (done) => {
      const obj = {
        accessToken: 'a310u',
        username: 'refocus-collector-user',
        bearerToken: 'b3ar3r',
      };
      const sanitized = sanitize(obj, ['accessToken', 'bearerToken']);
      expect(sanitized.accessToken).to.contain('...');
      expect(sanitized.accessToken.length).to.not.equal(obj.accessToken.length);
      expect(sanitized.bearerToken).to.contain('...');
      expect(sanitized.bearerToken.length).to.not.equal(obj.bearerToken.length);
      expect(sanitized.username).to.equal(obj.username);
      done();
    });
  });

  describe('collector metadata >', () => {
    it('getCurrentMetadata()', (done) => {
      const metadata = commonUtils.getCurrentMetadata();
      expect(metadata).to.be.an('object');

      const osKeys =
        ['arch', 'hostname', 'platform', 'release', 'type', 'username'];
      expect(metadata.osInfo).to.be.an('object');
      expect(metadata.osInfo).to.have.all.keys(osKeys);
      expect(metadata.osInfo.arch).to.be.a('string');
      expect(metadata.osInfo.hostname).to.be.a('string');
      expect(metadata.osInfo.platform).to.be.a('string');
      expect(metadata.osInfo.release).to.be.a('string');
      expect(metadata.osInfo.type).to.be.a('string');
      expect(metadata.osInfo.username).to.be.a('string');

      const processKeys =
        ['execPath', 'memoryUsage', 'uptime', 'version', 'versions'];
      expect(metadata.processInfo).to.be.an('object');
      expect(metadata.processInfo).to.have.all.keys(processKeys);
      expect(metadata.processInfo.execPath).to.be.a('string');

      const memoryUsageKeys = ['rss', 'heapTotal', 'heapUsed'];
      expect(metadata.processInfo.memoryUsage).to.be.an('object');
      expect(metadata.processInfo.memoryUsage)
      .to.include.all.keys(memoryUsageKeys);
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

    describe('assignContext >', () => {
      const encryptionAlgorithm = 'aes-256-cbc';
      const token = 'longaphanumerictoken';
      const hbResponse = {
        collectorConfig: {
          heartbeatInterval: 50,
          status: 'Running',
        },
        encryptionAlgorithm,
        timestamp: Date.now(),
        generatorsAdded: [],
        generatorsUpdated: [],
        generatorsDeleted: [],
      };

      it('null ctx OK', () => {
        const ctx = null;
        const def = { a: { default: 'abc' } };

        expect(commonUtils.assignContext(ctx, def, token, hbResponse)).to
          .have.property('a', 'abc');
      });

      it('empty ctx OK', () => {
        const ctx = {};
        const def = { a: { default: 'abc' } };
        expect(commonUtils.assignContext(ctx, def, token, hbResponse))
          .to.have.property('a', 'abc');
      });

      it('undefined ctx OK', () => {
        const ctx = undefined;
        const def = { a: { default: 'abc' } };
        expect(commonUtils.assignContext(ctx, def, token, hbResponse))
          .to.have.property('a', 'abc');
      });

      it('def with default does not overwrite ctx if exists', () => {
        const ctx = { a: 'xxx' };
        const def = { a: { default: 'abc' } };
        expect(commonUtils.assignContext(ctx, def, token, hbResponse))
          .to.have.property('a', 'xxx');
      });

      it('def with no default has no effect', () => {
        const ctx = { a: 'xxx' };
        const def = { a: { description: 'This is "a"' } };
        expect(commonUtils.assignContext(ctx, def, token, hbResponse)).to
          .have.property('a', 'xxx');
      });

      it('def with empty default adds attribute to ctx', () => {
        const ctx = { };
        const def = { a: { default: '' } };
        expect(commonUtils.assignContext(ctx, def, token, hbResponse)).to
          .have.property('a', '');
      });

      it('def with null default adds attribute to ctx', () => {
        const ctx = { };
        const def = { a: { default: null } };
        expect(commonUtils.assignContext(ctx, def, token, hbResponse)).to
          .have.property('a', null);
      });

      it('falsey def with falsey ctx should be ok', () => {
        const ctx = null;
        const def = null;
        const _ctx = commonUtils.assignContext(ctx, def, token, hbResponse);
        expect(_ctx).to.deep.equals({ });
      });

      it('falsey def with non falsey ctx should be ok', () => {
        const ctx = {
          okStatus: 'OK',
        };
        const def = null;
        const _ctx = commonUtils.assignContext(ctx, def, token, hbResponse);
        expect(_ctx).to.deep.equals(ctx);
      });

      describe('with encrypted ctx attributes', () => {
        const password = 'reallylongsecretpassword';
        const secret = token + hbResponse.timestamp;
        it('encrypted ctx attributes must be decrypted back', () => {
          const ctx = {
            password: commonUtils.encrypt(password, secret, encryptionAlgorithm),
            token: commonUtils.encrypt(token, secret, encryptionAlgorithm),
          };

          const def = {
            password: {
              encrypted: true,
            },
            token: {
              encrypted: true,
            },
            notASecret: {
              encrypted: false,
            },
          };

          const _ctx = commonUtils.assignContext(ctx, def, token, hbResponse);
          expect(_ctx).to.deep.equals({ password, token, });
        });

        it('unencrypted ctx attributes should not be effected', () => {
          const notASecret = 'somenotsecretValue';
          const ctx = {
            password: commonUtils.encrypt(password, secret, encryptionAlgorithm),
            token: commonUtils.encrypt(token, secret, encryptionAlgorithm),
            notASecret,
          };

          const def = {
            password: {
              encrypted: true,
            },
            token: {
              encrypted: true,
            },
            notASecret: {
              encrypted: false,
            },
          };
          const _ctx = commonUtils.assignContext(ctx, def, token, hbResponse);
          expect(_ctx).to.deep.equals({ password, token, notASecret, });
        });

        it('falsey ctx with a non falsey def that has encrypted attributes ' +
          ' should be ok', () => {
          const ctx = null;
          const def = {
            password: {
              encrypted: true,
            },
            token: {
              encrypted: true,
            },
            notASecret: {
              encrypted: false,
            },
          };
          const _ctx = commonUtils.assignContext(ctx, def, token, hbResponse);
          expect(_ctx).to.deep.equals({ });
        });
      });
    });
  });
});
