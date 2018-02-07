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
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const hu = require('../../src/heartbeat/utils');
const queueUtils = require('../../src/utils/queueUtils');
const sinon = require('sinon');
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
      status: 'Running',
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

  describe('changeCollectorStatus', () => {
    it('when newStatus=Stopped stop should be executed irrespective of ' +
      'the previous status', (done) => {
      const spyBuffQueue = sinon.spy(queueUtils, 'flushAllBufferedQueues');
      const spyRepeater = sinon.spy(repeater, 'stopAllRepeat');
      const stubExit = sinon.stub(process, 'exit');
      hu.changeCollectorStatus('Paused', 'Stopped');
      hu.changeCollectorStatus('Running', 'Stopped');
      expect(spyBuffQueue.calledTwice).to.equal(true);
      expect(spyRepeater.calledTwice).to.equal(true);
      expect(stubExit.calledTwice).to.equal(true);
      spyRepeater.restore();
      spyBuffQueue.restore();
      stubExit.restore();
      done();
    });

    it('currentStatus = Running and newStatus = Paused', (done) => {
      const spy = sinon.spy(repeater, 'pauseGenerators');
      hu.changeCollectorStatus('Running', 'Paused');
      expect(spy.calledOnce).to.equal(true);
      spy.restore();
      done();
    });

    it('currentStatus = Paused and newStatus = Paused', (done) => {
      const spy = sinon.spy(repeater, 'pauseGenerators');
      hu.changeCollectorStatus('Paused', 'Paused');
      expect(spy.calledOnce).to.equal(false);
      spy.restore();
      done();
    });

    it('currentStatus = Paused and newStatus = Running', (done) => {
      const spy = sinon.spy(repeater, 'resumeGenerators');
      hu.changeCollectorStatus('Paused', 'Running');
      expect(spy.calledOnce).to.equal(true);
      spy.restore();
      done();
    });

    it('currentStatus = Running and newStatus = Running', (done) => {
      const spyPause = sinon.spy(repeater, 'pauseGenerators');
      const spyResume = sinon.spy(repeater, 'resumeGenerators');
      const spyFlushQueue = sinon.spy(queueUtils, 'flushAllBufferedQueues');
      const spyStopAll = sinon.spy(repeater, 'stopAllRepeat');
      const stubExit = sinon.stub(process, 'exit');
      hu.changeCollectorStatus('Running', 'Running');
      expect(spyPause.called).to.equal(false);
      expect(spyResume.called).to.equal(false);
      expect(spyFlushQueue.called).to.equal(false);
      expect(spyStopAll.called).to.equal(false);
      expect(stubExit.called).to.equal(false);
      spyPause.restore();
      spyResume.restore();
      spyStopAll.restore();
      spyFlushQueue.restore();
      stubExit.restore();
      done();
    });
  });

  describe('addGenerator >', () => {
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
});
