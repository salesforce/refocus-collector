/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/heartbeat/utils.js
 */
'use strict';

const expect = require('chai').expect;
const hu = require('../../src/heartbeat/utils');
const encrypt = require('../../src/utils/commonUtils').encrypt;
const qUtils = require('../../src/utils/queueUtils');
const configModule = require('../../src/config/config');
const repeater = require('../../src/repeater/repeater');
const encryptionAlgorithm = 'aes-256-cbc';
describe('test/heartbeat/utils.js >', () => {
  const token = 'longaphanumerictoken';

  const hbResponse = {
    collectorConfig: {
      heartbeatInterval: 50,
    },
    encryptionAlgorithm,
    timestamp: Date.now(),
    generatorsAdded: [],
    generatorsUpdated: [],
    generatorsDeleted: [],
  };

  describe('assignContext>', () => {
    it('null ctx OK', () => {
      const ctx = null;
      const def = { a: { default: 'abc' } };

      expect(hu.assignContext(ctx, def, token, hbResponse)).to
        .have.property('a', 'abc');
    });

    it('empty ctx OK', () => {
      const ctx = {};
      const def = { a: { default: 'abc' } };
      expect(hu.assignContext(ctx, def, token, hbResponse))
        .to.have.property('a', 'abc');
    });

    it('undefined ctx OK', () => {
      const ctx = undefined;
      const def = { a: { default: 'abc' } };
      expect(hu.assignContext(ctx, def, token, hbResponse))
        .to.have.property('a', 'abc');
    });

    it('def with default does not overwrite ctx if exists', () => {
      const ctx = { a: 'xxx' };
      const def = { a: { default: 'abc' } };
      expect(hu.assignContext(ctx, def, token, hbResponse))
        .to.have.property('a', 'xxx');
    });

    it('def with no default has no effect', () => {
      const ctx = { a: 'xxx' };
      const def = { a: { description: 'This is "a"' } };
      expect(hu.assignContext(ctx, def, token, hbResponse)).to
        .have.property('a', 'xxx');
    });

    it('def with empty default adds attribute to ctx', () => {
      const ctx = { };
      const def = { a: { default: '' } };
      expect(hu.assignContext(ctx, def, token, hbResponse)).to
        .have.property('a', '');
    });

    it('def with null default adds attribute to ctx', () => {
      const ctx = { };
      const def = { a: { default: null } };
      expect(hu.assignContext(ctx, def, token, hbResponse)).to
        .have.property('a', null);
    });

    it('falsey def with falsey ctx should be ok', () => {
      const ctx = null;
      const def = null;
      const _ctx = hu.assignContext(ctx, def, token, hbResponse);
      expect(_ctx).to.deep.equals({ });
    });

    it('falsey def with non falsey ctx should be ok', () => {
      const ctx = {
        okStatus: 'OK',
      };
      const def = null;
      const _ctx = hu.assignContext(ctx, def, token, hbResponse);
      expect(_ctx).to.deep.equals(ctx);
    });

    describe('with encrypted ctx attributes', () => {
      const password = 'reallylongsecretpassword';
      const secret = token + hbResponse.timestamp;
      it('encrypted ctx attributes must be decrypted back', () => {
        const ctx = {
          password: encrypt(password, secret, encryptionAlgorithm),
          token: encrypt(token, secret, encryptionAlgorithm),
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

        const _ctx = hu.assignContext(ctx, def, token, hbResponse);
        expect(_ctx).to.deep.equals({ password, token, });
      });

      it('unencrypted ctx attributes should not be effected', () => {
        const notASecret = 'somenotsecretValue';
        const ctx = {
          password: encrypt(password, secret, encryptionAlgorithm),
          token: encrypt(token, secret, encryptionAlgorithm),
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
        const _ctx = hu.assignContext(ctx, def, token, hbResponse);
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
        const _ctx = hu.assignContext(ctx, def, token, hbResponse);
        expect(_ctx).to.deep.equals({ });
      });
    });
  });

  describe('addGenerator>', () => {
    const genName1 = 'Gen1';
    const genName2 = 'Gen2';
    beforeEach(() => {
      configModule.clearConfig();
      configModule.initializeConfig();
    });

    afterEach(() => {
      repeater.stop(genName1);
      repeater.stop(genName2);
    });

    after(() => configModule.clearConfig());

    it('different queues are created for different generators', (done) => {
      const heartbeatResp = {
        collectorConfig: {
          heartbeatInterval: 50,
        },
        timestamp: Date.now(),
        generatorsAdded: [
          {
            name: genName1,
            token: 'some-dummy-token-gen1',
            generatorTemplate: {
              name: 'gen-template-1',
              connection: {
                url: 'https://example.api',
                bulk: true,
              },
            },
          },
          {
            name: genName2,
            token: 'some-dummy-token-gen2',
            generatorTemplate: {
              name: 'gen-template-2',
              connection: {
                url: 'https://example.api',
                bulk: true,
              },
            },
          },
        ],
        generatorsUpdated: [],
        generatorsDeleted: [],
      };
      hu.addGenerator(heartbeatResp);
      const qGen1 = qUtils.getQueue(genName1);
      const qGen2 = qUtils.getQueue(genName2);
      expect(qGen1._size).to.be.equal(100);
      expect(qGen2._size).to.be.equal(100);
      done();
    });
  });

  describe('createOrUpdateGeneratorQueue >', () => {
    const heartbeatResp = {
      collectorConfig: {
        heartbeatInterval: 50,
        maxSamplesPerBulkRequest: 1000,
        sampleUpsertQueueTime: 4000,
      },
      timestamp: Date.now(),
      generatorsAdded: [
        {
          name: 'Gen1',
          token: 'some-dummy-token-gen1',
          generatorTemplate: {
            name: 'gen-template-1',
            connection: {
              url: 'https://example.api',
              bulk: true,
            },
          },
        },
      ],
      generatorsUpdated: [],
      generatorsDeleted: [],
    };

    before(() => {
      configModule.clearConfig();
      configModule.initializeConfig();
    });

    it('OK, new queue created', (done) => {
      const qpresent = qUtils.getQueue('qName1');
      expect(qpresent).to.be.equal(undefined);

      hu.createOrUpdateGeneratorQueue('qName1', token, heartbeatResp);
      const qGen1 = qUtils.getQueue('qName1');
      expect(qGen1._size).to.be.equal(100);
      done();
    });

    it('OK, queue already exists, updated', (done) => {
      qUtils.createQueue({
        name: 'qName1',
        size: 10,
        flushTimeout: 4000,
        verbose: false,
        flushFunction: (data) => data,
      });

      const qpresent = qUtils.getQueue('qName1');
      expect(qpresent._size).to.be.equal(10);
      hu.createOrUpdateGeneratorQueue('qName1', token, heartbeatResp);
      const qUpdated = qUtils.getQueue('qName1');
      expect(qUpdated._size).to.be.equal(1000);
      done();
    });

    it('Not ok, queue name null', (done) => {
      try {
        hu.createOrUpdateGeneratorQueue(null, token, heartbeatResp);
        done('Expecting error');
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        expect(err.message).to.be.equal(
          'Queue name should be provided for queue creation.'
        );
        done();
      }
    });

    it('Not ok, heartbeat response null', (done) => {
      try {
        hu.createOrUpdateGeneratorQueue('qName1', token, null);
        done('Expecting error');
      } catch (err) {
        expect(err.name).to.be.equal('ValidationError');
        expect(err.message).to.be.equal(
          'Heartbeat response should be provided for queue creation.'
        );
        done();
      }
    });
  });
});
