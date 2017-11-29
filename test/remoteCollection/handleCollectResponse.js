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
const refocusUrl = 'http://www.example.com';
const errors = require('../../src/errors');
const hcr = require('../../src/remoteCollection/handleCollectResponse');
const validateCollectResponse = hcr.validateCollectResponse;
const handleCollectResponse = hcr.handleCollectResponse;
const prepareTransformArgs = hcr.prepareTransformArgs;
const queueUtils = require('../../src/utils/queueUtils');
const httpStatus = require('../../src/constants').httpStatus;
const configModule = require('../../src/config/config');
const httpUtils = require('../../src/utils/httpUtils');

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
        validateCollectResponse({ name: 'Foo', url: 'abc.com' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if arg missing "name" attribute', (done) => {
      try {
        validateCollectResponse({ res: {}, url: 'abc.com' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if arg missing "url" attribute', (done) => {
      try {
        validateCollectResponse({ res: {}, name: 'Foo' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if res missing status code', (done) => {
      try {
        validateCollectResponse({ res: {}, url: 'abc.com', name: 'Foo' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error if invalid status code', (done) => {
      try {
        validateCollectResponse({ res: { statusCode: 4 }, url: 'abc.com', name: 'Foo' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('ok', (done) => {
      try {
        validateCollectResponse({ res: { statusCode: 200 }, preparedUrl: 'abc.com', name: 'Foo' });
        done();
      } catch (err) {
        done(err);
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
      subject: { absolutePath: 'S1.S2' },
      generatorTemplate: {
        transform:
         'return [{ name: "S1.S2|A1", value: 10 }, { name: "S1.S2|A2", value: 2 }]',
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

  describe('handleCollectResponse', () => {

    let winstonInfoStub;
    configModule.initializeConfig();
    const config = configModule.getConfig();
    before(() => {
      queueUtils.createQueue('bulkUpsertSampleQueue',
        config.refocus.maxSamplesPerBulkRequest,
        config.refocus.sampleUpsertQueueTime,
        false,
        httpUtils.doBulkUpsert
      );

      // console.log(queueUtils.getQueue('bulkUpsertSampleQueue'));
      // use nock to mock the response when flushing
      const sampleArr = [
        { name: 'S1.S2|A1', value: 10 }, { name: 'S1.S2|A2', value: 2 },
      ];
      nock(refocusUrl)
      .post(bulkEndPoint, sampleArr)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

      // stub winston info to test the logs
      winstonInfoStub = sinon.stub(winston, 'info');
    });

    afterEach(() => {
      winstonInfoStub.reset();
      queueUtils.getQueue('bulkUpsertSampleQueue').Items = [];
    });

    after(() => {
      // restore winston stub
      winstonInfoStub.restore();
    });

    const collectRes = {
      name: 'mockGenerator',
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      ctx: {},
      res: {
        statusCode: 200,
        statusMessage: 'MOCK STATUS MESSAGE',
        body: {
          text: '{ "a": "text" }',
        },
      },
      subjects: [{ absolutePath: 'S1.S2', name: 'S2', }],
      generatorTemplate: {
        connection: {
          bulk: true,
        },
        transform: {
          transform: 'return [{ name: "S1.S2|A1", value: "10" },'
          + ' { name: "S1.S2|A2", value: "2" }]',
          errorHandlers: {
            404: 'return [{ name: "S1.S2|A1", messageBody: "NOT FOUND" },'
            + ' { name: "S1.S2|A2", messageBody: "NOT FOUND" }]',
            '40[13]': 'return [{ name: "S1.S2|A1", messageBody: "UNAUTHORIZED OR FORBIDDEN" },'
            + ' { name: "S1.S2|A2", messageBody: "UNAUTHORIZED OR FORBIDDEN" }]',
            '5..': 'return [{ name: "S1.S2|A1", messageBody: "SERVER ERROR" },'
            + ' { name: "S1.S2|A2", messageBody: "SERVER ERROR" }]',
          },
        },
      },
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      preparedUrl: 'abc.com',
    };

    it('OK', (done) => {
      collectRes.res.statusCode = 200;
      const expected = [
        { name: 'S1.S2|A1', value: '10' }, { name: 'S1.S2|A2', value: '2' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('error handler match - 404', (done) => {
      collectRes.res.statusCode = 404;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'NOT FOUND' },
        { name: 'S1.S2|A2', messageBody: 'NOT FOUND' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('error handler match - 401', (done) => {
      collectRes.res.statusCode = 401;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
        { name: 'S1.S2|A2', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('error handler match - 403', (done) => {
      collectRes.res.statusCode = 403;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
        { name: 'S1.S2|A2', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('error handler match - 500', (done) => {
      collectRes.res.statusCode = 500;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'SERVER ERROR' },
        { name: 'S1.S2|A2', messageBody: 'SERVER ERROR' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('error handler match - 503', (done) => {
      collectRes.res.statusCode = 503;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'SERVER ERROR' },
        { name: 'S1.S2|A2', messageBody: 'SERVER ERROR' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('error handler match - override 200', (done) => {
      collectRes.res.statusCode = 200;
      collectRes.generatorTemplate.transform.errorHandlers['200'] =
        'return [{ name: "S1.S2|A1", messageBody: "OK" },'
        + ' { name: "S1.S2|A2", messageBody: "OK" }]';
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'OK' },
        { name: 'S1.S2|A2', messageBody: 'OK' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('no match - default error handler', (done) => {
      collectRes.res.statusCode = 400;
      collectRes.res.statusMessage = 'MOCK 400';
      const expected = defaultErrorSamples(400, 'MOCK 400');
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('no error handlers - default error handler', (done) => {
      collectRes.generatorTemplate.transform.errorHandlers = {};
      collectRes.res.statusCode = 404;
      collectRes.res.statusMessage = 'MOCK 404';
      const expected = defaultErrorSamples(404, 'MOCK 404');
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('transform is a string', (done) => {
      collectRes.res.statusCode = 200;
      collectRes.generatorTemplate.transform =
        'return [{ name: "S1.S2|A1", value: "10" }, { name: "S1.S2|A2", value: "2" }]';
      const expected = [
        { name: 'S1.S2|A1', value: '10' }, { name: 'S1.S2|A2', value: '2' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    it('transform is a string, handles all status codes', (done) => {
      collectRes.res.statusCode = 404;
      collectRes.generatorTemplate.transform =
        'return [{ name: "S1.S2|A1", value: "10" }, { name: "S1.S2|A2", value: "2" }]';
      const expected = [
        { name: 'S1.S2|A1', value: '10' }, { name: 'S1.S2|A2', value: '2' },
      ];
      handleCollectResponse(Promise.resolve(collectRes))
      .then(() => checkLogs(expected))
      .then(done)
      .catch(done);
    });

    function checkLogs(expected) {
      expect(winston.info.calledOnce).to.be.true;
      expect(winston.info.args[0][0]).contains('generator: mockGenerator');
      expect(winston.info.args[0][0]).contains(`numSamples: ${expected.length}`);
      const queue = queueUtils.getQueue('bulkUpsertSampleQueue');
      expect(queue.items.length).to.be.equal(expected.length);
      expect(queue.items[0]).to.eql(expected[0]);
      expect(queue.items[1]).to.eql(expected[1]);
    }

    function defaultErrorSamples(statusCode, statusMessage) {
      return [
        {
          name: 'S1.S2|A1',
          value: 'ERROR',
          messageCode: 'ERROR',
          messageBody: `abc.com returned HTTP status ${statusCode}: ${statusMessage}`,
          relatedLinks: [],
        },
        {
          name: 'S1.S2|A2',
          value: 'ERROR',
          messageCode: 'ERROR',
          messageBody: `abc.com returned HTTP status ${statusCode}: ${statusMessage}`,
          relatedLinks: [],
        },
      ];
    }
  });

  describe('prepareTransformArgs >', () => {
    const generator = {
      name: 'mockGenerator',
      subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      ctx: { a: 'a', b: 'b' },
      res: { body: 'aaa' },
      generatorTemplate: {
        connection: {
          bulk: true,
        },
      },
    };

    it('bulk', (done) => {
      const args = prepareTransformArgs(generator);
      expect(args).to.have.property('ctx', generator.ctx);
      expect(args).to.have.property('res', generator.res);
      expect(args).to.have.property('aspects', generator.aspects);
      expect(args).to.have.property('subjects', generator.subjects);
      expect(args).to.not.have.property('name');
      expect(args).to.not.have.property('generatorTemplate');
      done();
    });

    it('by subject', (done) => {
      generator.generatorTemplate.connection.bulk = false;
      const args = prepareTransformArgs(generator);
      expect(args).to.have.property('ctx', generator.ctx);
      expect(args).to.have.property('res', generator.res);
      expect(args).to.have.property('aspects', generator.aspects);
      expect(args).to.have.property('subject', generator.subjects[0]);
      expect(args).to.not.have.property('name');
      expect(args).to.not.have.property('generatorTemplate');
      done();
    });
  });
});

