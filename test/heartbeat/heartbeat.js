/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/heartbeat/heartbeat.js
 */
'use strict'; // eslint-disable-line strict
const nock = require('nock');
const expect = require('chai').expect;
const configModule = require('../../src/config/config');
const heartbeat = require('../../src/heartbeat/heartbeat');
const httpStatus = require('../../src/constants').httpStatus;
const q = require('../../src/utils/queue');
const repeater = require('../../src/repeater/repeater');
const sgt = require('../sgt');
const sinon = require('sinon');
const logger = require('winston');
logger.configure({ level: 0 });

let config;
const refocusUrl = 'http://refocusheartbeatmock.com';

const generator1 = {
  name: 'Core_Trust1_heartbeat',
  aspects: [{ name: 'A1' }],
  generatorTemplateName: 'refocus-trust1-collector',
  subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
  context: { baseTrustUrl: 'https://example.api', },
  possibleCollectors: [{ name: 'agent1' }],
  generatorTemplate: sgt,
  refocus: {
    url: refocusUrl,
  },
  token: 'mygeneratorusertoken',
  intervalSecs: 6,
};

const generator1Updated = {
  name: 'Core_Trust1_heartbeat',
  aspects: [{ name: 'A1' }],
  generatorTemplateName: 'refocus-trust1-collector',
  subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
  context: { baseTrustUrl: 'https://example.api', },
  possibleCollectors: [{ name: 'agent1' }],
  generatorTemplate: sgt,
  refocus: {
    url: refocusUrl,
  },
  token: 'mygeneratorusertoken',
  intervalSecs: 12,
};

const generator2 = {
  name: 'generator2_heartbeat',
  intervalSecs: 6,
  aspects: [{ name: 'A2' }],
  subjectQuery: '?absolutePath=S1.S2',
  subjects: [{ absolutePath: 'S1.S2', name: 'S2' }],
  generatorTemplate: {
    connection: {
      url: 'http://www.abc.com',
      bulk: false,
    },
    transform: sgt.transform,
  },
  refocus: {
    url: refocusUrl,
  },
  token: 'mygeneratorusertoken',
};

const generator3 = {
  name: 'generator3_heartbeat',
  intervalSecs: 6,
  aspects: [{ name: 'A3' }],
  subjectQuery: '?absolutePath=S1.S2',
  subjects: [{ absolutePath: 'S1.S2', name: 'S2' }],
  generatorTemplate: sgt,
  refocus: {
    url: refocusUrl,
  },
  token: 'mygeneratorusertoken',
};

const errorResponse = {
  error: 'Forbidden error with heartbeat',
};

const hbResponseNoSG = {
  collectorConfig: {
    heartbeatIntervalMillis: 50,
    maxSamplesPerBulkUpsert: 10,
    sampleUpsertQueueTimeMillis: 100,
    status: 'Running',
  },
  generatorsAdded: [],
  generatorsUpdated: [],
  generatorsDeleted: [],
};

const hbResponseWithSG = {
  collectorConfig: {
    heartbeatIntervalMillis: 20,
    maxSamplesPerBulkUpsert: 100,
    status: 'Running',
  },
  generatorsAdded: [
    generator1,
  ],
  generatorsUpdated: [],
  generatorsDeleted: [],
};

const hbResponseStatusPaused = {
  collectorConfig: {
    heartbeatIntervalMillis: 20,
    maxSamplesPerBulkUpsert: 100,
    status: 'Paused',
  },
  generatorsAdded: [
  ],
  generatorsUpdated: [],
  generatorsDeleted: [],
};

const hbResponseStatusStopped = {
  collectorConfig: {
    heartbeatIntervalMillis: 120,
    maxSamplesPerBulkUpsert: 300,
    status: 'Stopped',
  },
};

const hbResponseWithSGToDelete = {
  collectorConfig: {
    heartbeatIntervalMillis: 99,
    maxSamplesPerBulkUpsert: 999,
    status: 'Running',
  },
  generatorsAdded: [
  ],
  generatorsUpdated: [],
  generatorsDeleted: [
    generator1,
    generator2,
    generator3,
  ],
};

const hbResponseWithSGToUpdate = {
  collectorConfig: {
    heartbeatIntervalMillis: 120,
    maxSamplesPerBulkUpsert: 7000,
    status: 'Running',
  },
  generatorsAdded: [
    generator2,
    generator3,
  ],
  generatorsUpdated: [
    generator1Updated,
  ],
  generatorsDeleted: [],
};

describe('test/heartbeat/heartbeat.js >', () => {
  const collectorName = 'collectorForHeartbeatTests';
  const heartbeatEndpoint = `/v1/collectors/${collectorName}/heartbeat`;
  const collectorToken = 'm0ck3dt0k3n';
  let spyFlushQueue;
  let spyPause;
  let spyResume;
  let spyStopAll;
  let stubExit;

  before((done) => {
    configModule.clearConfig();
    configModule.initializeConfig();
    config = configModule.getConfig();
    config.name = collectorName;
    config.refocus.url = refocusUrl;
    config.refocus.collectorToken = collectorToken;
    done();
  });

  after((done) => {
    configModule.clearConfig();
    done();
  });

  afterEach(() => {
    repeater.stopAllRepeaters();
  });

  it('error from heartbeat response', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.FORBIDDEN, errorResponse);

    heartbeat()
    .then((err) => {
      expect(err.response.status).to.equal(httpStatus.FORBIDDEN);
      expect(err.response.body).deep.equal(errorResponse);
      done();
    })
    .catch(done);
  });

  it('Ok, simple response without generators', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseNoSG);

    heartbeat()
    .then((res) => {
      expect(res).to.have.all.keys('refocus', 'generators', 'metadata', 'name');
      expect(res.generators).to.deep.equal({});
      expect(res.refocus).to.include(hbResponseNoSG.collectorConfig);
      done();
    })
    .catch(done);
  });

  it('Ok, handle a complete response with generators', (done) => {
    nock('https://example.api')
    .get('/v1/instances/status/preview')
    .reply(httpStatus.OK, [], { 'Content-Type': 'application/json' });

    nock(refocusUrl, {
      reqheaders: { authorization: 'mygeneratorusertoken' },
    })
    .get('/v1/subjects')
    .query({
      absolutePath: 'Parent.Child.*',
      tags: 'Primary',
    })
    .reply(httpStatus.OK, [{ absolutePath: 'Parent.Child.One', name: 'One' }]);

    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseWithSG);

    heartbeat()
    .then((res) => {
      expect(res).to.have.all.keys('generators', 'metadata', 'name', 'refocus');
      expect(res.refocus).to.include(hbResponseWithSG.collectorConfig);
      expect(Object.keys(res.generators)).to.deep.equal([generator1.name]);
      done();
    })
    .catch(done);
  });

  it('Ok, send heartbeat end-to-end', (done) => {
    nock(refocusUrl, {
      reqheaders: { authorization: 'mygeneratorusertoken' },
    })
    .get('/v1/subjects')
    .times(2)
    .query({
      absolutePath: 'Parent.Child.*',
      tags: 'Primary',
    })
    .reply(httpStatus.OK, [{ absolutePath: 'Parent.Child.One', name: 'One' }]);

    nock(refocusUrl, {
      reqheaders: { authorization: 'mygeneratorusertoken' },
    })
    .get('/v1/subjects')
    .times(4)
    .query({
      absolutePath: 'S1.S2',
    })
    .reply(httpStatus.OK, [{ absolutePath: 'S1.S2', name: 'S1' }]);

    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseWithSG);

    nock('https://example.api')
    .get('/v2')
    .reply(httpStatus.OK, [true], { 'Content-Type': 'application/json' });

    // send heartbeat to get a response to add generator1
    heartbeat()
    .then(() => {
      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseWithSGToUpdate);

      /*
       * send heartbeat to get a response to add generator2, generator3
       * and update generator1
       */
      return heartbeat();
    })
    .then((res) => {
      expect(res).to.have.all.keys('generators', 'metadata', 'name', 'refocus');
      expect(res.refocus).to.include(hbResponseWithSGToUpdate.collectorConfig);

      // make sure the generator1 is updated
      expect(res.generators[generator1.name].generatorTemplate).to.deep.equal(
        generator1Updated.generatorTemplate);

      // make sure generator2 and generator 3 are added
      expect(res.generators[generator2.name].name).to.equal(generator2.name);
      expect(res.generators[generator3.name].name).to.equal(generator3.name);

      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseWithSGToDelete);

      // send another heartbeat to get a response to delete all the generators
      return heartbeat();
    })
    .then((res) => {
      expect(res).to.have.all.keys('generators', 'metadata', 'name', 'refocus');
      expect(res.generators).to.deep.equal({});
      expect(res.refocus).to.include(hbResponseWithSGToDelete.collectorConfig);
      done();
    })
    .catch(done);
  });

  it('Ok, collector status in heartbeat full cycle ' +
    'Running->Pause->Running->Stop', (done) => {
    const reply = [
      { absolutePath: 'S1.S2', name: 'S1' },
      { absolutePath: 'S1.S2', name: 'S2' },
    ];

    // set up mock endpoints to get subjects from
    // generator2 endpoint
    nock(refocusUrl, {
      reqheaders: { authorization: 'mygeneratorusertoken' },
    })
    .get('/v1/subjects')
    .times(3)
    .query({
      absolutePath: 'S1.S2',
    })
    .reply(httpStatus.OK, reply);

    // generator1 endpoint
    nock(refocusUrl, {
      reqheaders: { authorization: 'mygeneratorusertoken' },
    })
    .get('/v1/subjects')
    .times(2)
    .query({
      absolutePath: 'Parent.Child.*',
      tags: 'Primary',
    })
    .reply(httpStatus.OK, [{ absolutePath: 'Parent.Child.One', name: 'One' }]);

    nock('https://example.api')
    .get('/v1/instances/status/preview')
    .times(2)
    .reply(httpStatus.OK, [], { 'Content-Type': 'application/json' });

    // mock response for first heartbeat
    nock(refocusUrl, {
      reqheaders: { authorization: collectorToken },
    })
    .post(heartbeatEndpoint)
    .reply(httpStatus.OK, hbResponseWithSG);

    // send heartbeat with status = running
    heartbeat()
    .then((res) => {
      expect(res.refocus).to.include(hbResponseWithSG.collectorConfig);

      // mock response for second heartbeat.
      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseStatusPaused);

      spyPause = sinon.spy(repeater, 'pauseGenerators');

      // send heartbeat with status = paused
      return heartbeat();
    })
    .then((res) => {
      expect(spyPause.calledOnce).to.equal(true);
      expect(res.refocus).to.include(hbResponseStatusPaused.collectorConfig);

      // mock response for third heartbeat
      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseWithSGToUpdate);
      spyResume = sinon.spy(repeater, 'resumeGenerators');

      // send heartbeat with status = running to resume the paused generators
      return heartbeat();
    })
    .then((res) => {
      expect(spyResume.calledOnce).to.equal(true);
      expect(res.refocus).to.include(hbResponseWithSGToUpdate.collectorConfig);

      // make sure the generator1 is updated
      expect(res.generators[generator1.name].generatorTemplate).to.deep.equal(
        generator1Updated.generatorTemplate);

      // make sure generator2 and generator 3 are added
      expect(res.generators[generator2.name].name).to.equal(generator2.name);
      expect(res.generators[generator3.name].name).to.equal(generator3.name);

      nock(refocusUrl, {
        reqheaders: { authorization: collectorToken },
      })
      .post(heartbeatEndpoint)
      .reply(httpStatus.OK, hbResponseStatusStopped);
      spyFlushQueue = sinon.spy(q, 'flushAll');
      spyStopAll = sinon.spy(repeater, 'stopAllRepeaters');
      stubExit = sinon.stub(process, 'exit');

      // send heartbeat with status = stop to stop the collector
      return heartbeat();
    })
    .then(() => {
      expect(spyStopAll.calledOnce).to.equal(true);
      expect(spyFlushQueue.calledOnce).to.equal(true);
      expect(stubExit.calledOnce).to.equal(true);
      expect(repeater.tracker).to.deep.equal({});
      spyPause.restore();
      spyResume.restore();
      spyStopAll.restore();
      spyFlushQueue.restore();
      stubExit.restore();
      return done();
    })
    .catch(done);
  });
});
