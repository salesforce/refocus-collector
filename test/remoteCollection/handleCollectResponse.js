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
const handleCollectResponseBulk = hcr.handleCollectResponseBulk;
const handleCollectResponseBySubject = hcr.handleCollectResponseBySubject;
const prepareTransformArgs = hcr.prepareTransformArgs;
const httpStatus = require('../../src/constants').httpStatus;
const configModule = require('../../src/config/config');
const httpUtils = require('../../src/utils/httpUtils');
const logger = require('winston');
logger.configure({ level: 0 });

describe('test/remoteCollection/handleCollectResponse.js >', () => {
  describe('validateCollectResponse >', () => {
    it('error - arg is undefined', (done) => {
      try {
        validateCollectResponse();
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - arg is null', (done) => {
      try {
        validateCollectResponse(null);
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - arg is array', (done) => {
      try {
        validateCollectResponse(['a', 1]);
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - arg missing "res" attribute', (done) => {
      try {
        validateCollectResponse({ name: 'Foo', url: 'abc.com' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - arg missing "name" attribute', (done) => {
      try {
        validateCollectResponse({ res: {}, url: 'abc.com' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - arg missing "url" attribute', (done) => {
      try {
        validateCollectResponse({ res: {}, name: 'Foo' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - res missing status code', (done) => {
      try {
        validateCollectResponse({ res: {}, url: 'abc.com', name: 'Foo' });
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('error - invalid status code', (done) => {
      const cr = { res: { statusCode: 4 }, url: 'abc.com', name: 'Foo' };
      try {
        validateCollectResponse(cr);
        done('Expecting error');
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        done();
      }
    });

    it('ok', (done) => {
      const cr = {
        res: { statusCode: 200 },
        preparedUrl: 'abc.com',
        name: 'Foo',
        generatorTemplate: {
          connection: {},
        },
        connection: {},
      };
      try {
        validateCollectResponse(cr);
        done();
      } catch (err) {
        done(err);
      }
    });

    it('error - invalid content type', (done) => {
      const cr = {
        res: {
          statusCode: 200,
          headers: {
            'content-type': 'text/xml',
          },
        },
        preparedUrl: 'abc.com',
        name: 'Foo',
        preparedHeaders: {
          Accept: 'application/json',
        },
      };
      try {
        validateCollectResponse(cr);
        done(new Error('Expecting error'));
      } catch (err) {
        expect(err).to.have.property('name', 'ValidationError');
        expect(err).to.have.property('message',
          'Accept application/json but got text/xml');
        done();
      }
    });

    it('no schema defined', (done) => {
      const resSchema = undefined;

      const cr = {
        res: {
          statusCode: 200,
          body: {
            a: 'a',
            b: 'b',
          },
        },
        preparedUrl: 'abc.com',
        name: 'Foo',
      };
      expect(() => validateCollectResponse(cr, resSchema)).to.not.throw();
      done();
    });

    it('schema defined - validateResponseBody called', (done) => {
      const resSchema = JSON.stringify({
        type: 'object',
        required: ['body'],
        properties: {
          body: {
            type: 'object',
            required: ['a', 'b'],
            properties: {
              a: { type: 'string' },
              b: { type: 'string' },
            },
          },
        },
      });

      const cr = {
        res: {
          statusCode: 200,
          body: {
            a: 'a',
          },
        },
        preparedUrl: 'abc.com',
        name: 'Foo',
      };
      expect(() => validateCollectResponse(cr, resSchema)).to.throw(
        errors.ValidationError,
        "Response validation failed - /body - should have required property 'b'"
      );
      done();
    });
  });

  describe('handleCollectResponseBulk >', () => {
    const generatorName = 'mockGenerator';
    let winstonInfoStub;
    before(() => {
      // use nock to mock the response when upserting
      nock(refocusUrl)
      .post(bulkEndPoint)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

      // stub winston info to test the logs
      winstonInfoStub = sinon.stub(winston, 'info');
    });

    afterEach(() => {
      winstonInfoStub.reset();
    });

    before(() =>
      configModule.initializeConfig()
    );

    after(() => {
      // restore winston stub
      winstonInfoStub.restore();
      configModule.clearConfig();
    });

    const collectRes = {
      name: generatorName,
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      context: {},
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
          default: 'return [{ name: "S1.S2|A1", value: "10" },' +
            ' { name: "S1.S2|A2", value: "2" }]',
          errorHandlers: {
            404: 'return [{ name: "S1.S2|A1", messageBody: "NOT FOUND" },'
              + ' { name: "S1.S2|A2", messageBody: "NOT FOUND" }]',
            '40[13]': 'return [{ name: "S1.S2|A1", messageBody: "UNAUTHORIZED OR FORBIDDEN" },'
              + ' { name: "S1.S2|A2", messageBody: "UNAUTHORIZED OR FORBIDDEN" }]',
            '5..': 'return [{ name: "S1.S2|A1", messageBody: "SERVER ERROR" },'
              + ' { name: "S1.S2|A2", messageBody: "SERVER ERROR" }]',
          },
          responseSchema: JSON.stringify({
            type: 'object',
            required: ['body'],
            properties: {
              body: {
                type: 'object',
                required: ['text'],
                properties: {
                  text: { type: 'string' },
                },
              },
            },
          }),
        },
      },
      aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
      preparedUrl: 'abc.com',
    };

    it('OK', () => {
      collectRes.res.statusCode = 200;
      const expected = [
        { name: 'S1.S2|A1', value: '10' }, { name: 'S1.S2|A2', value: '2' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('error handler match - 404', () => {
      collectRes.res.statusCode = 404;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'NOT FOUND' },
        { name: 'S1.S2|A2', messageBody: 'NOT FOUND' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('error handler match - 401', () => {
      collectRes.res.statusCode = 401;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
        { name: 'S1.S2|A2', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('error handler match - 403', () => {
      collectRes.res.statusCode = 403;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
        { name: 'S1.S2|A2', messageBody: 'UNAUTHORIZED OR FORBIDDEN' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('error handler match - 500', () => {
      collectRes.res.statusCode = 500;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'SERVER ERROR' },
        { name: 'S1.S2|A2', messageBody: 'SERVER ERROR' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('error handler match - 503', () => {
      collectRes.res.statusCode = 503;
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'SERVER ERROR' },
        { name: 'S1.S2|A2', messageBody: 'SERVER ERROR' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('error handler match - override 200', () => {
      collectRes.res.statusCode = 200;
      collectRes.generatorTemplate.transform.errorHandlers['200'] =
        'return [{ name: "S1.S2|A1", messageBody: "OK" },'
        + ' { name: "S1.S2|A2", messageBody: "OK" }]';
      const expected = [
        { name: 'S1.S2|A1', messageBody: 'OK' },
        { name: 'S1.S2|A2', messageBody: 'OK' },
      ];

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('no match - default error handler', () => {
      collectRes.res.statusCode = 400;
      collectRes.res.statusMessage = 'MOCK 400';
      const message = `abc.com returned HTTP status 400: MOCK 400`;
      const expected = defaultErrorSamples(message);

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('no error handlers - default error handler', () => {
      collectRes.generatorTemplate.transform.errorHandlers = {};
      collectRes.res.statusCode = 404;
      collectRes.res.statusMessage = 'MOCK 404';
      const message = `abc.com returned HTTP status 404: MOCK 404`;
      const expected = defaultErrorSamples(message);

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('invalid response (no status code) - default error handler', () => {
      delete collectRes.res.statusCode;
      const message = 'Invalid response from abc.com: ' +
        'missing HTTP status code (abc.com)';
      const expected = defaultErrorSamples(message);

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    it('invalid response (schema mismatch) - default error handler', () => {
      collectRes.res.statusCode = 200;
      delete collectRes.res.body.text;
      const message = 'Response validation failed - /body - ' +
        "should have required property 'text' (abc.com)";
      const expected = defaultErrorSamples(message);

      return handleCollectResponseBulk(collectRes)
      .then(() => checkLogs(expected));
    });

    function checkLogs(expected) {
      expect(winston.info.calledOnce).to.be.true;
      expect(winston.info.args[0][0])
        .to.have.property('generator', 'mockGenerator');
      expect(winston.info.args[0][0])
        .to.have.property('numSamples', expected.length);
    }

    function defaultErrorSamples(message) {
      return [
        {
          name: 'S1.S2|A1',
          value: 'ERROR',
          messageCode: 'ERROR',
          messageBody: message,
        },
        {
          name: 'S1.S2|A2',
          value: 'ERROR',
          messageCode: 'ERROR',
          messageBody: message,
        },
      ];
    }
  });

  describe('handleCollectResponseBySubject >', () => {

    before((done) => {
      configModule.clearConfig();
      configModule.initializeConfig();
      done();
    });

    before(() => {
      // use nock to mock the response when upserting
      nock(refocusUrl)
      .post(bulkEndPoint)
      .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

      // stub winston info to test the logs
      winstonInfoStub = sinon.stub(winston, 'info');
    });
    afterEach(() => {
      winstonInfoStub.reset();
    });
    before(() =>
      configModule.initializeConfig()
    );
    after(() => {
      // restore winston stub
      winstonInfoStub.restore();
      configModule.clearConfig();
    });

    const generatorName = 'mockGenerator';
    const config = configModule.getConfig();

    const collectRes = [
      {
        name: generatorName,
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
        context: {},
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
            default: 'return [{ name: "S1.S2|A1", value: "10" },' +
              ' { name: "S1.S2|A2", value: "2" }]',
            errorHandlers: {
              404: 'return [{ name: "S1.S2|A1", messageBody: "NOT FOUND" },'
                + ' { name: "S1.S2|A2", messageBody: "NOT FOUND" }]',
              '40[13]': 'return [{ name: "S1.S2|A1", messageBody: "UNAUTHORIZED OR FORBIDDEN" },'
                + ' { name: "S1.S2|A2", messageBody: "UNAUTHORIZED OR FORBIDDEN" }]',
              '5..': 'return [{ name: "S1.S2|A1", messageBody: "SERVER ERROR" },'
                + ' { name: "S1.S2|A2", messageBody: "SERVER ERROR" }]',
            },
            responseSchema: JSON.stringify({
              type: 'object',
              required: ['body'],
              properties: {
                body: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: { type: 'string' },
                  },
                },
              },
            }),
          },
        },
        preparedUrl: 'abc.com',
      }, {
        name: generatorName,
        aspects: [{ name: 'A1', timeout: '1m' }, { name: 'A2', timeout: '1m' }],
        context: {},
        res: {
          statusCode: 200,
          statusMessage: 'MOCK STATUS MESSAGE',
          body: {
            text: '{ "a": "text" }',
          },
        },
        subjects: [{ absolutePath: 'S1.S3', name: 'S3', }],
        generatorTemplate: {
          connection: {
            bulk: true,
          },
          transform: {
            default: 'return [{ name: "S1.S3|A1", value: "10" },' +
              ' { name: "S1.S3|A2", value: "2" }]',
            errorHandlers: {
              404: 'return [{ name: "S1.S3|A1", messageBody: "NOT FOUND" },'
                + ' { name: "S1.S3|A2", messageBody: "NOT FOUND" }]',
              '40[13]': 'return [{ name: "S1.S3|A1", messageBody: "UNAUTHORIZED OR FORBIDDEN" },'
                + ' { name: "S1.S3|A2", messageBody: "UNAUTHORIZED OR FORBIDDEN" }]',
              '5..': 'return [{ name: "S1.S3|A1", messageBody: "SERVER ERROR" },'
                + ' { name: "S1.S3|A2", messageBody: "SERVER ERROR" }]',
            },
            responseSchema: JSON.stringify({
              type: 'object',
              required: ['body'],
              properties: {
                body: {
                  type: 'object',
                  required: ['text'],
                  properties: {
                    text: { type: 'string' },
                  },
                },
              },
            }),
          },
        },
        preparedUrl: 'abc.com',
      },
    ];

    function checkLogs(expected) {
      expect(winston.info.calledOnce).to.be.true;
      expect(winston.info.args[0][0])
      .to.have.property('generator', 'mockGenerator');
      expect(winston.info.args[0][0])
      .to.have.property('numSamples', expected.length);
    }

    const expected = [
      { name: 'S1.S2|A1', value: '10' }, { name: 'S1.S2|A2', value: '2' },
      { name: 'S1.S3|A1', value: '10' }, { name: 'S1.S3|A2', value: '2' },
    ];

    it('OK', () => {
      nock(refocusUrl)
        .get('/')
        .times(2)
        .reply(httpStatus.OK, {});

      return handleCollectResponseBySubject(collectRes)
      .then(() => checkLogs(expected));
    });
  });

  describe('prepareTransformArgs >', () => {
    const generator = {
      name: 'mockGenerator',
      subjects: [{ absolutePath: 'S1' }, { absolutePath: 'S2' }],
      aspects: [{ name: 'A1' }, { name: 'A2' }],
      context: { a: 'a', b: 'b' },
      res: { body: 'aaa' },
      generatorTemplate: {
        connection: {
          bulk: true,
        },
        preparedUrl: 'abc.com',
      },
    };

    it('bulk', (done) => {
      const args = prepareTransformArgs(generator);
      expect(args).to.have.property('ctx', generator.context);
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
      expect(args).to.have.property('ctx', generator.context);
      expect(args).to.have.property('res', generator.res);
      expect(args).to.have.property('aspects', generator.aspects);
      expect(args).to.have.property('subject', generator.subjects[0]);
      expect(args).to.not.have.property('name');
      expect(args).to.not.have.property('generatorTemplate');
      done();
    });
  });
});
