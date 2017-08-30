/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/sampleQueue/sampleQueueOps.js
 */
const expect = require('chai').expect;

const configModule = require('../../src/config/config');
const sampleUpsertUtils = require('../../src/sampleQueue/sampleUpsertUtils');
const sinon = require('sinon');
const tu = require('../testUtils');
const bulkEndPoint = require('../../src/constants').bulkUpsertEndpoint;
const winston = require('winston');
const nock = require('nock');
const mockRest = require('../mockedResponse');
const httpStatus = require('../../src/constants').httpStatus;
const registry = tu.config.registry;
const refocusUrl = registry.refocusInstances[
  Object.keys(tu.config.registry.refocusInstances)[0]
].url;
configModule.clearConfig();
configModule.setRegistry(registry);
const sampleQueueOps =  require('../../src/sampleQueue/sampleQueueOps');
const ValidationError = require('../../src/errors').ValidationError;

describe('test/sampleQueue/sampleQueueOps.js >', () => {
  let samples;
  let winstonInfoStub;
  let winstonErrStub;

  beforeEach(() => {
    samples = [];
    for (let i = 0; i < 10; i++) { // create 10 samples
      samples.push({ name: `sample${i.toString()}|aspName`, value: '' + i });
    }

    winstonInfoStub = sinon.stub(winston, 'info');
    winstonErrStub = sinon.stub(winston, 'error');
  });

  afterEach(() => {
    winstonInfoStub.restore();
    winstonErrStub.restore();
  });

  describe('validateSample >', () => {
    it('ok', (done) => {
      const sample = { name: 'sample1|aspName', value: '0' };
      expect(() => sampleQueueOps.validateSample(sample)).to.not.throw();
      done();
    });

    it('throws', (done) => {
      const sample = 'abc';
      expect(() => sampleQueueOps.validateSample(sample))
      .to.throw(ValidationError);
      done();
    });
  });

  describe('enqueue >', () => {
    it('ok', (done) => {
      // check the sample queue length and contents
      sampleQueueOps.enqueue(samples);
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(10);
      expect(sampleQueueOps.sampleQueue[0].name).to.be.equal('sample0|aspName');
      expect(sampleQueueOps.sampleQueue[9].name).to.be.equal('sample9|aspName');

      // check the logs
      expect(winston.info.calledOnce).to.be.true;
      expect(winston.info.calledWith('Enqueue successful for 10 samples'))
      .to.be.true;
      done();
    });

    it('failed', (done) => {
      sampleQueueOps.enqueue([['randomText']]);
      expect(winston.error.calledOnce).to.be.true;
      expect(winston.error.args[0][0])
      .contains('Enqueue failed: ValidationError');
      done();
    });
  });

  describe('flush >', () => {
    beforeEach(() => sampleQueueOps.flush(100, tu.refocusInstance1));

    it('number of samples < maxSamplesPerBulkRequest, ok', (done) => {
      // check that bulk upsert called expected number of times and with
      // right arguments
      sampleQueueOps.enqueue(samples);
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(10);
      const doBulkUpsert = sinon.spy(sampleUpsertUtils, 'doBulkUpsert');
      sampleQueueOps.flush(100, tu.refocusInstance1);
      sinon.assert.calledOnce(doBulkUpsert);
      expect(doBulkUpsert.args[0][0].url).to.be.equal('http://www.xyz.com');
      expect(doBulkUpsert.args[0][0].token).to.be.string;
      expect(doBulkUpsert.args[0][1][1].name).to.be.equal('sample1|aspName');
      expect(doBulkUpsert.args[0][1].length).to.be.equal(10);
      doBulkUpsert.restore();
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(0);

      done();
    });

    it('number of samples > maxSamplesPerBulkRequest, ok', (done) => {
      for (let i = 0; i < 250; i++) { // create and enqueue 250 more samples
        samples.push({ name: `sample${i.toString()}|aspName`, value: '' + i });
      }

      // check that bulk upsert called expected number of times and with
      // right arguments
      sampleQueueOps.enqueue(samples);
      const doBulkUpsert = sinon.spy(sampleUpsertUtils, 'doBulkUpsert');
      sampleQueueOps.flush(100, tu.refocusInstance1);

      // maxSamplesPerBulkRequest = 100, hence doBulkUpsert called thrice
      sinon.assert.calledThrice(doBulkUpsert);
      expect(doBulkUpsert.args[0][1].length).to.be.equal(100);
      expect(doBulkUpsert.args[1][1].length).to.be.equal(100);
      expect(doBulkUpsert.args[2][1].length).to.be.equal(60);
      doBulkUpsert.restore();
      expect(sampleQueueOps.sampleQueue.length).to.be.equal(0);
      done();
    });
  });

  describe(' bulkUpsertAndLog >', () => {
    afterEach(() => {
      nock.cleanAll();
    });

    // Needs setTimeout delay to pass, hence skipping.
    it.skip('bulkUpsertAndLog, ok', (done) => {
      // mock the bulk upsert request.
      nock(refocusUrl)
        .post(bulkEndPoint, samples)
        .reply(httpStatus.CREATED, mockRest.bulkUpsertPostOk);

      sampleQueueOps.bulkUpsertAndLog(samples, tu.refocusInstance1);

      // Since logs are created after the bulkUpsert async call returns, hence
      // setTimeout to wait for promise to complete.
      setTimeout(() => {
        expect(winston.info.calledOnce).to.be.true;
        expect(winston.info.args[0][0].activity).to.equal('bulkUpsertSamples');
        expect(winston.info.args[0][0].sampleCount).to.equal(10);
        done();
      }, 1900);
    });

    it.skip('bulkUpsertAndLog, error', (done) => {
      // mock the bulk upsert request.
      nock(refocusUrl)
        .post(bulkEndPoint, samples)
        .reply(httpStatus.BAD_REQUEST, {});
      sampleQueueOps.bulkUpsertAndLog(samples, tu.refocusInstance1);
      setTimeout(() => {
        // Since logs are created after the bulkUpsert async call returns, hence
        // setTimeout to wait for promise to complete.

        expect(winston.error.calledOnce).to.be.true;
        expect(winston.error.args[0][0]).contains(
          'doBulkUpsert failed for 10 samples'
        );

        done();
      }, 1980);
    });
  });
});
