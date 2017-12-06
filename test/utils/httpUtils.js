/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/httpUtils.js
 */
const expect = require('chai').expect;
const httpUtils = require('../../src/utils/httpUtils');
const request = require('superagent');
const bulkUpsertPath = require('../../src/constants').bulkUpsertEndpoint;
const mock = require('superagent-mocker')(request);
const httpStatus = require('../../src/constants').httpStatus;
const configModule = require('../../src/config/config');
const sinon = require('sinon');
require('superagent-proxy')(request);
const nock = require('nock');
const bulkUpsertEndpoint = require('../../src/constants')
                            .bulkUpsertEndpoint;

describe('test/utils/httpUtils.js >', () => {
  const dummyStr = 'http://dummy.refocus.url';
  const dummyToken = '3245678754323356475654356758675435647qwertyrytu';
  const properRegistryObject = { url: dummyStr, token: dummyToken };
  const sampleArr = [{ name: 'sample1' }, { name: 'sample2' }];
  configModule.clearConfig();
  configModule.initializeConfig();

  describe('doBulkUpsert >', () => {
    const dummyUserToken = 'some-user-token-string-asfdfhsdjf';

    // clear stub
    after(mock.clearRoutes);

    before(() => {
      const config = configModule.getConfig();
      config.refocus.collectorToken = dummyToken;
    });

    it('no url in refocus instance object, gives validation error', (done) => {
      httpUtils.doBulkUpsert([], dummyUserToken)
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(httpStatus.BAD_REQUEST);
        done();
      });
    });

    it('no array input gives validation error', (done) => {
      const config = configModule.getConfig();
      config.refocus.url = dummyStr;
      httpUtils.doBulkUpsert()
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(httpStatus.BAD_REQUEST);
        done();
      });
    });

    it('array input of non-array type gives validation error', (done) => {
      httpUtils.doBulkUpsert(dummyStr, dummyUserToken)
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(httpStatus.BAD_REQUEST);
        done();
      });
    });

    it('no user token, gives validation error', (done) => {
      httpUtils.doBulkUpsert([])
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(httpStatus.BAD_REQUEST);
        done();
      });
    });

    // TODO: add test to show how doBulkUpsert handles
    // failed bulkUpsert response

    it('empty array is ok', (done) => {

      // TODO: change to nock, stub response
      mock.post(properRegistryObject.url + bulkUpsertPath, () => Promise.resolve());
      httpUtils.doBulkUpsert([], dummyUserToken)
      .then((object) => {
        expect(object.status).to.equal(httpStatus.OK);
        done();
      })
      .catch(done);
    });

    it('array of samples is returned', (done) => {

      // TODO: change to nock, stub response
      mock.post(properRegistryObject.url + bulkUpsertPath,
        (req) => req);
      httpUtils.doBulkUpsert(sampleArr, dummyUserToken)
      .then((object) => {

        // due to how superagent-mocker works,
        // request.body is sent and returned as
        // { '0': { name: 'sample1' }, '1': { name: 'sample2' } }
        // instead of an array
        expect(object.body['0']).to.deep.equal(sampleArr[0]);
        expect(object.body['1']).to.deep.equal(sampleArr[1]);
        expect(object.status).to.equal(httpStatus.OK);
        done();
      })
      .catch(done);
    });

    it('ok, request use refocus proxy if set in config', (done) => {
      const config = configModule.getConfig();
      const refocusProxy = 'http://abcProxy.com';
      config.refocus.proxy = refocusProxy;
      config.refocus.url = dummyStr;

      nock(dummyStr)
        .post(bulkUpsertEndpoint)
        .reply(httpStatus.OK, { status: 'OK' });

      const spy = sinon.spy(request, 'post');
      httpUtils.doBulkUpsert(sampleArr, dummyUserToken)
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(refocusProxy);
        spy.restore();
        configModule.clearConfig();
        configModule.initializeConfig();
        done();
      })
      .catch((err) => {
        spy.restore();
        configModule.clearConfig();
        configModule.initializeConfig();
        done(err);
      });
    });

    it('ok, request does not use refocus proxy if not set in config',
    (done) => {
      const config = configModule.getConfig();
      config.refocus.url = dummyStr;
      config.refocus.collectorToken = dummyToken;

      nock(dummyStr)
        .post(bulkUpsertEndpoint)
        .reply(httpStatus.OK, { status: 'OK' });

      const spy = sinon.spy(request, 'post');
      httpUtils.doBulkUpsert(sampleArr, dummyUserToken)
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(undefined);
        spy.restore();
        done();
      })
      .catch((err) => {
        spy.restore();
        done(err);
      });
    });
  });
});
