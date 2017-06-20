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

  it('should return a ValidationError error if res.text JSON parse fails',
  (done) => {
    const collectRes = {
      ctx: {},
      res: { text: 'randomText' },
      subject: { absolutePath: 'abc' },
      generatorTemplate: { transform:
        'return [{ name: "S1|A1", value: 10 }, { name: "S1|A1", value: 2 }]',
      },
    };
    handleCollectRes(Promise.resolve(collectRes))
    .then(() => done('Expecting Validation Error'))
    .catch((err) => {
      expect(err.message).to.contain('Could not JSON parse res.text of object' +
      ' passed to handleCollectResponse');
      expect(err.name).to.equal('ValidationError');
      done();
    });
  });

  it('should return an Validation error when obj does not have name ' +
    'attribute', (done) => {
    const obj = {
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

  it('should call doBulkUpsert to push samples to refocus', (done) => {
    // use nock to mock the response when flushing
    const sampleArr = [
      { name: 'S1|A1', value: 10 }, { name: 'S2|A2', value: 2 },
    ];
    nock(refocusUrl)
      .post(bulkEndPoint, sampleArr)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

    const collectRes = {
      name: 'mockGenerator',
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
      expect(winston.info.args[0][0]).to.be.equal(
        'Generator: mockGenerator, generated 2 samples.'
      );
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
