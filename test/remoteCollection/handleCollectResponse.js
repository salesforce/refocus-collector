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
const refocusUrl = tu.config.registry.refocusInstances[
  Object.keys(tu.config.registry.refocusInstances)[0]
].url;
const errors = require('../../src/config/errors');
const hcr = require('../../src/remoteCollection/handleCollectResponse');
const validateCollectResponse = hcr.validateCollectResponse;
const handleCollectResponse = hcr.handleCollectResponse;

const httpStatus = require('../../src/constants').httpStatus;
const sampleQueueOps = require('../../src/sampleQueue/sampleQueueOps');

describe('test/remoteCollection/handleCollectResponse.js >', () => {
  describe('validateCollectResponse >', () => {
    it('error if arg is undefined', (done) => {
      try {
        validateCollectResponse();
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if arg is null', (done) => {
      try {
        validateCollectResponse(null);
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if arg is array', (done) => {
      try {
        validateCollectResponse(['a', 1]);
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if arg missing "res" attribute', (done) => {
      try {
        validateCollectResponse({ name: 'Foo' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if arg missing "name" attribute', (done) => {
      try {
        validateCollectResponse({ res: {} });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });
  });

  it('ArgsError when obj does not have subject attribute', (done) => {
    const obj = {
      aspects: [{ name: 'A', timeout: '1h' }],
      context: {},
      res: {},
      generatorTemplate: {
        transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
      },
    };
    handleCollectResponse(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.message).to.contain('Must include EITHER a "subject" ' +
        'attribute OR a "subjects" attribute.');
      expect(err.name).to.equal('ArgsError');
    });
    done();
  });

  it('ArgsError when obj does not have context attribute', (done) => {
    const obj = {
      res: {},
      subject: { absolutePath: 'abc' },
      generatorTemplate: {
        transform: 'return [{ name: "Foo" }, { name: "Bar" }]',
      },
    };
    handleCollectResponse(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.message).to.contain('Missing "context" attribute');
      expect(err.name).to.equal('ArgsError');
    });
    return done();
  });

  it('ValidationError when obj does not have name attribute', (done) => {
    const obj = {
      res: {},
      context: {},
      subject: { absolutePath: 'S1' },
      generatorTemplate: {
        transform:
         'return [{ name: "S1|A1", value: 10 }, { name: "S1|A2", value: 2 }]',
      },
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
    };
    handleCollectResponse(Promise.resolve(obj))
    .then(() => done('Expecting a ValidationError'))
    .catch((err) => {
      expect(err.name).to.equal('ValidationError');
      return done();
    })
    .catch(done);
  });

  it('calls doBulkUpsert to push samples to refocus', (done) => {
    // use nock to mock the response when flushing
    const sampleArr = [
      { name: 'S1|A1', value: 10 }, { name: 'S1|A2', value: 2 },
    ];
    nock(refocusUrl)
      .post(bulkEndPoint, sampleArr)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);
    const collectRes = {
      name: 'mockGenerator',
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      ctx: {},
      res: { text: '{ "a": "atext" }' },
      subjects: [{ absolutePath: 'S1' }],
      generatorTemplate: {
        transform: 'return ' +
          '[{ name: "S1|A1", value: "10" }, { name: "S1|A2", value: "2" }]',
      },
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
    };

    // stub winston info to test the logs
    const winstonInfoStub = sinon.stub(winston, 'info');
    handleCollectResponse(Promise.resolve(collectRes))
    .then(() => {
      // check the logs
      expect(winston.info.calledTwice).to.be.true;
      expect(winston.info.args[0][0]).contains('generator: mockGenerator');
      expect(winston.info.args[0][0]).contains('numSamples: 2');
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(2);
      expect(sampleQueueOps.sampleQueue[0])
      .to.eql({ name: 'S1|A1', value: '10' });
      expect(sampleQueueOps.sampleQueue[1])
      .to.eql({ name: 'S1|A2', value: '2' });
      sampleQueueOps.flush(100, tu.firstKeyPairInRefocusInstances);

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

