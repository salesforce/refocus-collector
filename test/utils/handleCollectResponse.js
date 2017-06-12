/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/utils/handleCollectResponse.js
 */
const expect = require('chai').expect;
const nock = require('nock');
const mockRest = require('../mockedResponse');
const bulkEndPoint = require('../../src/constants').bulkUpsertEndpoint;
const tu = require('../testUtils');
const registry = tu.config.registry[Object.keys(tu.config.registry)[0]];
const refocusUrl = registry.url;
const handleCollectRes =
  require('../../src/utils/handleCollectResponse').handleCollectResponse;

const httpStatus = require('../../src/constants').httpStatus;

describe('test/utils/handleCollectResponse.js >', () => {
  const sampleArr = [{ name: 'S1|A1', value: 10 }, { name: 'S1|A1', value: 2 }];

  it('should return an ArgsError error if handleCollectResponse is called ' +
    'without an argument', (done) => {
    const ret = handleCollectRes();
    expect(ret.name).to.equal('ArgsError');
    done();
  });

  it('should return an ArgsError if handleCollectResponse is called ' +
    'with null', (done) => {
    const ret = handleCollectRes(null);
    expect(ret.name).to.equal('ArgsError');
    done();
  });

  it('should return a ValidationError error if the object passed as an ' +
    'does not have an "res" attribute', (done) => {
    const obj = { ctx: {}, results: {} };
    const ret = handleCollectRes(obj);
    expect(ret.name).to.equal('ValidationError');
    done();
  });

  it('object passed as an argument should not be an array', (done) => {
    const obj = { ctx: {}, results: {} };
    const ret = handleCollectRes(obj);
    expect(ret.name).to.equal('ValidationError');
    done();
  });

  it('should return an ArgsError when obj does not have subject ' +
    'attribute', (done) => {
    const obj = { ctx: {}, res: {},
      transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
    };
    const ret = handleCollectRes(obj);
    expect(ret.name).to.equal('ArgsError');
    done();
  });

  it('should return an ArgsError error when obj does not have ctx ' +
    'attribute', (done) => {
    const obj = { res: {}, subject: { absolutePath: 'abc' },
      transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
    };
    const ret = handleCollectRes(obj);
    expect(ret.name).to.equal('ArgsError');
    done();
  });

  it('should call doBulkUpsert to push samples to refocus', (done) => {
    // use nock to mock the response
    nock(refocusUrl)
      .post(bulkEndPoint, sampleArr)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

    const collectRes = {
      ctx: {},
      res: {},
      subject: { absolutePath: 'abc' },
      transform:
        'return [{ name: "S1|A1", value: 10 }, { name: "S1|A1", value: 2 }]',
    };
    handleCollectRes(collectRes)
    .then((res) => {
      expect(res.status).to.equal(httpStatus.CREATED);
      expect(res.body.status).to.equal('OK');
      expect(res.body.jobId).not.equal(undefined);
      done();
    })
    .catch(done);
  });

  it('should also handle bad response from the refocus instance', (done) => {
    // use nock to mock the response
    const samplePayLoad = [{ name: 'S1|A1' }, { name: 'S1|A1' }];

    nock(refocusUrl)
      .post(bulkEndPoint, samplePayLoad)
      .reply(httpStatus.BAD_REQUEST, {});

    const collectRes = {
      ctx: {},
      res: {},
      subject: { absolutePath: 'abc' },
      transform:
        'return [{ name: "S1|A1" }, { name: "S1|A1" }]',
    };

    handleCollectRes(collectRes)
    .then(() => done('Expecting Bad Request Error'))
    .catch((err) => {
      expect(err.status).to.equal(httpStatus.BAD_REQUEST);
      done();
    });
  });
});
