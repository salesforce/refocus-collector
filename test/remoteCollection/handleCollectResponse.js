/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/remoteCollection/handleCollectResponse.js
 */
const expect = require('chai').expect;
const nock = require('nock');
const mockRest = require('../mockedResponse');
const bulkEndPoint = require('../../src/constants').bulkUpsertEndpoint;
const tu = require('../testUtils');
const registry = tu.config.registry[Object.keys(tu.config.registry)[0]];
const refocusUrl = registry.url;
const handleCollectRes =
  require('../../src/remoteCollection/handleCollectResponse')
    .handleCollectResponse;

const httpStatus = require('../../src/constants').httpStatus;

describe('test/remoteCollection/handleCollectResponse.js >', () => {
  const sampleArr = [{ name: 'S1|A1', value: 10 }, { name: 'S1|A1', value: 2 }];

  it('should return an ArgsError error if handleCollectResponse is called ' +
    'with a promise that resolves to null', (done) => {
    handleCollectRes(Promise.resolve(null))
    .then(() => done('Expecting Bad Request Error'))
    .catch((err) => {
      expect(err.message).to.contain('The argument to handleCollectResponse ' +
        'cannot be null or an Array');
      expect(err.name).to.equal('ArgsError');
      done();
    });
  });

  it('Promise passed should not resolve to an array', (done) => {
    const obj = ['ctx', 'results'];
    handleCollectRes(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.message).to.contain('The argument to handleCollectResponse ' +
        'cannot be null or an Array');
      expect(err.name).to.equal('ArgsError');
      done();
    });
  });

  it('should return an ArgsError when obj does not have subject ' +
    'attribute', (done) => {
    const obj = { ctx: {}, res: {},
      generatorTemplate: {
        transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
      },
    };
    handleCollectRes(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.message).to.contain('Must include EITHER a "subject" ' +
        'attribute OR a "subjects" attribute.');
      expect(err.name).to.equal('ArgsError');
      return done();
    });
  });

  it('should return an ArgsError error when obj does not have ctx ' +
    'attribute', (done) => {
    const obj = { res: {}, subject: { absolutePath: 'abc' },
      generatorTemplate: {
        transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
      },
    };
    handleCollectRes(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.message).to.contain('Missing "ctx" attribute');
      expect(err.name).to.equal('ArgsError');
      return done();
    });
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
      generatorTemplate: { transform:
        'return [{ name: "S1|A1", value: 10 }, { name: "S1|A1", value: 2 }]',
      },
    };
    handleCollectRes(Promise.resolve(collectRes))
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
      generatorTemplate: { transform:
        'return [{ name: "S1|A1" }, { name: "S1|A1" }]', },
    };

    handleCollectRes(Promise.resolve(collectRes))
    .then(() => done('Expecting Bad Request Error'))
    .catch((err) => {
      expect(err.status).to.equal(httpStatus.BAD_REQUEST);
      done();
    });
  });
});
