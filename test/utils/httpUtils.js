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
const sinon = require('sinon');
require('superagent-proxy')(request);
const nock = require('nock');
const bulkUpsertEndpoint = require('../../src/constants').bulkUpsertEndpoint;

describe('test/utils/httpUtils.js >', () => {
  const refocusUrl = 'http://dummy.refocus.url';
  const dummyToken = '3245678754323356475654356758675435647qwertyrytu';
  const collectorName = 'collector1_for_httpUtils';
  const sampleArr = [{ name: 'sample1' }, { name: 'sample2' }];

  describe('doPost >', () => {
    it('post ok, with body', (done) => {
      const stopEndpoint = `/v1/collectors/${collectorName}/stop`;
      nock(refocusUrl, {
        reqheaders: { authorization: dummyToken },
      })
      .post(stopEndpoint, { name: collectorName })
      .reply(httpStatus.OK);

      httpUtils.doPost(`${refocusUrl}${stopEndpoint}`, dummyToken,
        null, { name: collectorName })
      .then((res) => {
        expect(res.status).to.equal(httpStatus.OK);
        done();
      })
      .catch(done);
    });

    it('post ok, without body', (done) => {
      const resumeEndpoint = `/v1/collectors/${collectorName}/resume`;
      nock(refocusUrl, {
        reqheaders: { authorization: dummyToken },
      })
      .post(resumeEndpoint)
      .reply(httpStatus.OK);

      httpUtils.doPost(`${refocusUrl}${resumeEndpoint}`, dummyToken)
      .then((res) => {
        expect(res.status).to.equal(httpStatus.OK);
        done();
      })
      .catch(done);
    });

    it('post ok, with proxy', (done) => {
      const pauseEndpoint = `/v1/collectors/${collectorName}/pause`;
      nock(refocusUrl, {
        reqheaders: { authorization: dummyToken },
      })
      .post(pauseEndpoint, { name: collectorName })
      .reply(httpStatus.OK);

      httpUtils.doPost(`${refocusUrl}${pauseEndpoint}`, dummyToken,
        'http://dummy.refocus.proxy', { name: collectorName })
      .then((res) => {
        expect(res.status).to.equal(httpStatus.OK);
        done();
      })
      .catch(done);
    });

    it('post returns 4xx error', (done) => {
      const errorResponse = {
        error: 'Forbidden error with heartbeat',
      };
      const reregisterEndpoint = `/v1/collectors/${collectorName}/reregersiter`;
      nock(refocusUrl, {
        reqheaders: { authorization: '1nv5l19aT0k3n' },
      })
      .post(reregisterEndpoint, { name: collectorName })
      .reply(httpStatus.FORBIDDEN, errorResponse);

      httpUtils.doPost(refocusUrl + reregisterEndpoint,
        '1nv5l19aT0k3n', null, { name: collectorName })
      .then(() => done('Expecting 401 Forbidden error'))
      .catch((err) => {
        expect(err.response.status).to.equal(httpStatus.FORBIDDEN);
        expect(err.response.body).deep.equal(errorResponse);
        done();
      })
      .catch(done);
    });
  });

  describe('doBulkUpsert >', () => {
    const dummyUserToken = 'some-user-token-string-asfdfhsdjf';

    // clear stub
    after(mock.clearRoutes);

    it('no array input gives validation error', (done) => {
      httpUtils.doBulkUpsert(refocusUrl, dummyUserToken)
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(httpStatus.BAD_REQUEST);
        done();
      });
    });

    it('array input of non-array type gives validation error', (done) => {
      httpUtils.doBulkUpsert(refocusUrl, dummyUserToken, null, 'Hi')
      .then(() => done(new Error('Expected validation error')))
      .catch((err) => {
        expect(err.name).to.equal('ValidationError');
        expect(err.status).to.equal(httpStatus.BAD_REQUEST);
        done();
      });
    });

    it('no user token, gives validation error', (done) => {
      httpUtils.doBulkUpsert(refocusUrl)
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
      mock.post(refocusUrl + bulkUpsertPath, () => Promise.resolve());
      httpUtils.doBulkUpsert(refocusUrl + bulkUpsertPath, dummyUserToken, null,
        [])
      .then((object) => {
        expect(object.status).to.equal(httpStatus.OK);
        done();
      })
      .catch(done);
    });

    it('array of samples is returned', (done) => {
      // TODO: change to nock, stub response
      mock.post(refocusUrl + bulkUpsertPath,
        (req) => req);
      httpUtils.doBulkUpsert(refocusUrl + bulkUpsertPath, dummyUserToken, null,
        sampleArr)
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

    it('ok, request use refocus proxy if set', (done) => {
      const refocusProxy = 'http://abcProxy.com';

      nock(refocusUrl)
        .post(bulkUpsertEndpoint)
        .reply(httpStatus.OK, { status: 'OK' });

      const spy = sinon.spy(request, 'post');
      httpUtils.doBulkUpsert(refocusUrl + bulkUpsertEndpoint, dummyUserToken,
        refocusProxy, sampleArr)
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(refocusProxy);
        spy.restore();
        done();
      })
      .catch((err) => {
        spy.restore();
        done(err);
      });
    });

    it('ok, request does not use refocus proxy if not set', (done) => {
      nock(refocusUrl)
        .post(bulkUpsertEndpoint)
        .reply(httpStatus.OK, { status: 'OK' });

      const spy = sinon.spy(request, 'post');
      httpUtils.doBulkUpsert(refocusUrl + bulkUpsertEndpoint, dummyUserToken,
        null, sampleArr)
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
