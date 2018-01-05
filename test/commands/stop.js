/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/stop.js
 */
'use strict';
const expect = require('chai').expect;
const start = require('../../src/commands/start');
const stop = require('../../src/commands/stop');
const repeater = require('../../src/repeater/repeater');
const listener = require('../../src/heartbeat/listener');
const nock = require('nock');
const sinon = require('sinon');
const request = require('superagent');
require('superagent-proxy')(request);
const collectorName = 'collector1';
const refocusUrl = 'http://www.refocusserver.com';
const accessToken = 'abcdefghijklmnopqrstuvwxyz';
const collectorToken = 'zyxwvutsrqponmlkjihgfedcba';
const refocusProxy = 'http://refocusproxy.com';
const dataSourceProxy = 'http://datasourceproxy.com';
const httpStatus = require('../../src/constants.js').httpStatus;

beforeEach((done) => {
  nock(refocusUrl, {
    reqheaders: { authorization: accessToken },
  })
  .post('/v1/collectors/start',
    { name: `${collectorName}`, version: '1.0.0' })
  .reply(httpStatus.CREATED, { token: collectorToken });

  nock(refocusUrl, {
    reqheaders: { authorization: accessToken },
  })
  .post(`/v1/${collectorName}/stop`, { name: `${collectorName}` })
  .reply(httpStatus.OK);
  done();
});

describe('test/commands/stop >', () => {
  // TODO: child process fails on travis with error
  // /bin/sh: 1: refocus-collector: not found
  it('not ok, cannot run stop without running start first', (done) => {
    const { exec } = require('child_process');
    exec('refocus-collector stop',
    (error, stdout, stderr) => {
      console.log('error--', error);
      if (error) {
        console.error(`exec error: ${error}`);
        return done();
      }

      return done('Expected Stop to fail');
    });
  });

  it('stop without proxy', (done) => {
    start.execute(collectorName, refocusUrl, accessToken, {})
    .then(() => {
      // make sure start created the repeat
      expect(repeater.tracker.heartbeat).to.be.an('object');
    })
    .then(() => stop.execute())
    .then((res) => {
      expect(res.status).to.equal(httpStatus.OK);
      expect(repeater.tracker.heartbeat).to.equal(undefined);
      repeater.stopAllRepeat();
      done();
    })
    .catch((err) => done(err));
  });

  it('stop with proxy', (done) => {
    start.execute(collectorName, refocusUrl, accessToken,
      { refocusProxy, dataSourceProxy }
    )
    .then(() => {
      // make sure start created the repeat
      expect(repeater.tracker.heartbeat).to.be.an('object');
    })
    .then(() => stop.execute(true))
    .then((res) => {
      expect(res.status).to.equal(httpStatus.OK);
      expect(repeater.tracker.heartbeat).to.equal(undefined);
      done();
    })
    .catch((err) => done(err));
  });

  it('force stop, flush should not be called', (done) => {
    start.execute(collectorName, refocusUrl, accessToken,
      { refocusProxy, dataSourceProxy }
    )
    .then(() => {
      // make sure start created the repeat
      expect(repeater.tracker.heartbeat).to.be.an('object');
    })
    .then(() => stop.execute())
    .then((res) => {
      expect(res.status).to.equal(httpStatus.OK);
      expect(repeater.tracker.heartbeat).to.equal(undefined);
      done();
    })
    .catch((err) => done(err));
  });

  it('ok, refocus proxy used in request if provided', (done) => {
    let spy;
    start.execute(
      collectorName, refocusUrl, accessToken,
      { refocusProxy, dataSourceProxy }
    )
    .then(() => {
      spy = sinon.spy(request, 'post');
      stop.execute();
    })
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

  it('stop collector, with multiple generators running', (done) => {
    const res = {
      collectorConfig: {
        heartbeatInterval: 50,
        maxSamplesPerBulkRequest: 10,
      },
      generatorsAdded: [
        {
          name: 'Core_Trust1',
          aspects: [{ name: 'Latency', timeout: '1m' }],
          interval: 6000,
          generatorTemplateName: 'refocus-trust1-collector',
          generatorTemplate: {
            name: 'abc-gen-templ',
            connection: {
              url: 'https://coretrust1.data',
              bulk: true,
            },
          },
          subjectQuery: 'absolutePath=Parent.Child.*&tags=Primary',
          context: { baseUrl: 'https://coretrust1.data', },
        },
        {
          name: 'Core_Funnel1',
          aspects: [{ name: 'CrossWind', timeout: '1m' }],
          interval: 1000,
          context: { baseUrl: 'https://funnel.data', },
          generatorTemplate: {
            name: 'abc-gen-templ',
            connection: {
              url: 'https://funnel.data',
              bulk: true,
            },
          },
        },
      ],
    };
    start.execute(collectorName, refocusUrl, accessToken,
      { refocusProxy, dataSourceProxy }
    )
    .then(() => {
      listener.handleHeartbeatResponse(null, res);

      // make sure start created the repeat
      expect(repeater.tracker.heartbeat).to.be.an('object');
      expect(repeater.tracker.Core_Funnel1).to.be.an('object');
      expect(repeater.tracker.Core_Trust1).to.be.an('object');
    })
    .then(() => stop.execute())
    .then((stopRes) => {
      expect(stopRes.status).to.equal(httpStatus.OK);
      expect(repeater.tracker.heartbeat).to.equal(undefined);
      expect(repeater.tracker.Core_Funnel1).to.equal(undefined);
      expect(repeater.tracker.Core_Trust1).to.equal(undefined);
      done();
    })
    .catch((err) => done(err));
  });
});

