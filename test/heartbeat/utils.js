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
const constants = require('../../src/constants');

describe('test/heartbeat/utils.js >', () => {
  const refocusInstance = {
    name: 'stagingRefocusInstance',
    token: 'longaphanumerictoken',
  };

  const hbResponse = {
    collectorConfig: {
      heartbeatInterval: 50,
    },
    timestamp: Date.now(),
    generatorsAdded: [],
    generatorsUpdated: [],
    generatorsDeleted: [],
  };

  describe('assignContext>', () => {
    it('null ctx OK', () => {
      const ctx = null;
      const def = { a: { default: 'abc' } };

      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse)).to
        .have.property('a', 'abc');
    });

    it('empty ctx OK', () => {
      const ctx = {};
      const def = { a: { default: 'abc' } };
      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse))
        .to.have.property('a', 'abc');
    });

    it('undefined ctx OK', () => {
      const ctx = undefined;
      const def = { a: { default: 'abc' } };
      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse))
        .to.have.property('a', 'abc');
    });

    it('def with default does not overwrite ctx if exists', () => {
      const ctx = { a: 'xxx' };
      const def = { a: { default: 'abc' } };
      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse))
        .to.have.property('a', 'xxx');
    });

    it('def with no default has no effect', () => {
      const ctx = { a: 'xxx' };
      const def = { a: { description: 'This is "a"' } };
      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse)).to
        .have.property('a', 'xxx');
    });

    it('def with empty default adds attribute to ctx', () => {
      const ctx = { };
      const def = { a: { default: '' } };
      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse)).to
        .have.property('a', '');
    });

    it('def with null default adds attribute to ctx', () => {
      const ctx = { };
      const def = { a: { default: null } };
      expect(hu.assignContext(ctx, def, refocusInstance, hbResponse)).to
        .have.property('a', null);
    });

    it('falsey def with falsey ctx should be ok', () => {
      const ctx = null;
      const def = null;
      const _ctx = hu.assignContext(ctx, def, refocusInstance, hbResponse);
      expect(_ctx).to.deep.equals({ });
    });

    it('falsey def with non falsey ctx should be ok', () => {
      const ctx = {
        okStatus: 'OK',
      };
      const def = null;
      const _ctx = hu.assignContext(ctx, def, refocusInstance, hbResponse);
      expect(_ctx).to.deep.equals(ctx);
    });

    describe('with encrypted ctx attributes', () => {
      const password = 'reallylongsecretpassword';
      const token = 'alphanumerictoken';
      const secret = refocusInstance.token + hbResponse.timestamp;
      const algorithm = constants.encryptionAlgorithm;
      it('encrypted ctx attributes must be decrypted back', () => {
        const ctx = {
          password: encrypt(password, secret, algorithm),
          token: encrypt(token, secret, algorithm),
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

        const _ctx = hu.assignContext(ctx, def, refocusInstance, hbResponse);
        expect(_ctx).to.deep.equals({ password, token, });
      });

      it('unencrypted ctx attributes should not be effected', () => {
        const notASecret = 'somenotsecretValue';
        const ctx = {
          password: encrypt(password, secret, algorithm),
          token: encrypt(token, secret, algorithm),
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
        const _ctx = hu.assignContext(ctx, def, refocusInstance, hbResponse);
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
        const _ctx = hu.assignContext(ctx, def, refocusInstance, hbResponse);
        expect(_ctx).to.deep.equals({ });
      });
    });
  });
});
