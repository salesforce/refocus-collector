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
const sinon = require('sinon');
const winston = require('winston');
const mockRest = require('../mockedResponse');
const bulkEndPoint = require('../../src/constants').bulkUpsertEndpoint;
const tu = require('../testUtils');
const registry = tu.config.registry[Object.keys(tu.config.registry)[0]];
const refocusUrl = registry.url;
const handleCollectRes =
  require('../../src/remoteCollection/handleCollectResponse')
    .handleCollectResponse;

const httpStatus = require('../../src/constants').httpStatus;
const sampleQueueOps = require('../../src/sampleQueue/sampleQueueOps');

describe('test/remoteCollection/handleCollectResponse.js >', () => {
  it('ArgsError if handleCollectResponse is called with a promise which ' +
    'resolves to null', (done) => {
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

  it('ArgsError when obj does not have subject attribute', (done) => {
    const obj = {
      aspects: [{ name: 'A', timeout: '1h' }],
      ctx: {},
      res: {},
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
    });
    done();
  });

  it('ArgsError when obj does not have ctx attribute', (done) => {
    const obj = {
      res: {},
      subject: { absolutePath: 'abc' },
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

  it('ValidationError when obj does not have name attribute', (done) => {
    const obj = {
      aspects: [{ name: 'A', timeout: '1m' }],
      res: {},
      ctx: {},
      subject: { absolutePath: 'abc' },
      generatorTemplate: {
        transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
      },
    };
    handleCollectRes(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.message).to.contain('should have a "name" attribute');
      expect(err.name).to.equal('ValidationError');
      return done();
    })
    .catch(done);
  });

  it('calls doBulkUpsert to push samples to refocus', (done) => {
    // use nock to mock the response when flushing
    const sampleArr = [
      { name: 'S1|A1', value: 10 }, { name: 'S2|A2', value: 2 },
    ];
    nock(refocusUrl)
      .post(bulkEndPoint, sampleArr)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);
    const collectRes = {
      name: 'mockGenerator',
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      ctx: {},
      res: { text: '{ "a": "atext" }' },
      subject: { absolutePath: 'abc' },
      generatorTemplate: { transform:
        'return [{ name: "S1|A1", value: 10 }, { name: "S2|A2", value: 2 }]',
      },
    };

    // stub winston info to test the logs
    const winstonInfoStub = sinon.stub(winston, 'info');
    handleCollectRes(Promise.resolve(collectRes))
    .then(() => {
      // check the logs
      expect(winston.info.calledTwice).to.be.true;
      expect(winston.info.args[0][0]).contains('generator: mockGenerator');
      expect(winston.info.args[0][0]).contains('numSamples: 2');
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(2);
      expect(sampleQueueOps.sampleQueue[0])
      .to.eql({ name: 'S1|A1', value: 10 });
      expect(sampleQueueOps.sampleQueue[1]).to.eql({ name: 'S2|A2', value: 2 });
      sampleQueueOps.flush();

      // restore winston stub
      winstonInfoStub.restore();
      done();
    })
    .catch((err) => {
      winstonInfoStub.restore();
      done(err);
    });
  });
});
