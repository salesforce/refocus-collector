/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/start.js
 */
'use strict';

const expect = require('chai').expect;
const start = require('../../src/commands/start');
const repeater = require('../../src/repeater/repeater');
const configModule = require('../../src/config/config');
const nock = require('nock');
const fork = require('child_process').fork;
const sinon = require('sinon');
const request = require('superagent');
require('superagent-proxy')(request);

describe('test/commands/start >', () => {
  const collectorName = 'collector1';
  const refocusUrl = 'http://www.example.com';
  const accessToken = 'abcdefghijklmnopqrstuvwxyz';
  const invalidToken = 'aaa';
  const collectorToken = 'zyxwvutsrqponmlkjihgfedcba';
  const refocusProxy = 'http://abcproxy.com';
  const dataSourceProxy = 'http://xyzproxy.com';

  const missingCollectorNameError = 'error: You must specify a collector name\n';
  const missingUrlError = 'error: You must specify the url of the refocus instance\n';
  const missingTokenError = 'error: You must specify an access token\n';

  before(() => {
    nock(refocusUrl, {
      reqheaders: { authorization: accessToken },
    })
    .post('/v1/collectors/collector1/start')
    .reply(201, { collectorToken });

    nock(refocusUrl, {
      reqheaders: { authorization: invalidToken },
    })
    .post('/v1/collectors/collector1/start')
    .reply(401);
  });

  describe('from command line', () => {
    it('ok', (done) => {
      const args = [
        '--collectorName', collectorName, '--refocusUrl', refocusUrl,
        '--accessToken', accessToken, '--refocusProxy', refocusProxy,
        '--dataSourceProxy', dataSourceProxy,
      ];
      const opts = { silent: true };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.on('close', (code) => {
        expect(code).to.equal(0);
        done();
      });
    });

    it('no collectorName', (done) => {
      const args = [
        '--refocusUrl', refocusUrl, '--accessToken', accessToken,
      ];
      const opts = { silent: true };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.stderr.on('data', (data) => {
        expect(data.toString()).to.equal(missingCollectorNameError);
      });
      start.on('close', (code) => {
        expect(code).to.equal(1);
        done();
      });
    });

    it('no refocusUrl', (done) => {
      const args = [
        '--collectorName', collectorName, '--accessToken', accessToken,
      ];
      const opts = { silent: true };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.stderr.on('data', (data) => {
        expect(data.toString()).to.equal(missingUrlError);
      });
      start.on('close', (code) => {
        expect(code).to.equal(1);
        done();
      });
    });

    it('no accessToken', (done) => {
      const args = [
        '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      ];
      const opts = { silent: true };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.stderr.on('data', (data) => {
        expect(data.toString()).to.equal(missingTokenError);
      });
      start.on('close', (code) => {
        expect(code).to.equal(1);
        done();
      });
    });

    it('ok, no refocusProxy or dataSourceProxy', (done) => {
      const args = [
        '--collectorName', collectorName, '--refocusUrl', refocusUrl,
        '--accessToken', accessToken,
      ];
      const opts = { silent: true };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.on('close', (code) => {
        expect(code).to.equal(0);
        done();
      });
    });

    it('use environment variables if not specifed', (done) => {
      const args = [];
      const opts = {
        silent: true,
        env: {
          RC_COLLECTOR_NAME: collectorName,
          RC_REFOCUS_URL: refocusUrl,
          RC_ACCESS_TOKEN: accessToken,
          RC_REFOCUS_PROXY: refocusProxy,
          RC_DATA_SOURCE_PROXY: dataSourceProxy,
        },
      };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.on('close', (code) => {
        expect(code).to.equal(0);
        done();
      });
    });

    it('mix of arguments and environment variables', (done) => {
      const args = ['--collectorName', collectorName];
      const opts = {
        silent: true,
        env: {
          RC_REFOCUS_URL: refocusUrl,
          RC_DATA_SOURCE_PROXY: dataSourceProxy,
        },
      };
      const start = fork('src/commands/refocus-collector-start.js', args, opts);
      start.stderr.on('data', (data) => {
        expect(data.toString()).to.equal(missingTokenError);
      });
      start.on('close', (code) => {
        expect(code).to.equal(1);
        done();
      });
    });
  });

  describe('execute directly', () => {
    it('ok, no proxy', (done) => {
      start.execute(collectorName, refocusUrl, accessToken, {})
      .then(() => {
        const config = configModule.getConfig();
        expect(config.name).to.equal(collectorName);
        expect(config.refocus.url).to.equal(refocusUrl);
        expect(config.refocus.collectorToken).to.equal(collectorToken);
        expect(repeater.tracker).to.have.property('Heartbeat');
        repeater.stop('Heartbeat');
        done();
      })
      .catch((err) => done(err));
    });

    it('post returns error', (done) => {
      start.execute(collectorName, refocusUrl, invalidToken, {})
      .then(() => done('expecting error'))
      .catch((err) => {
        expect(err.name).to.equal('CollectorStartError');
        expect(err.explanation).to.equal(
          'POST http://www.example.com/v1/collectors/collector1/start failed:' +
          ' 401 Unauthorized');
        done();
      });
    });

    it('ok, with proxy provided', (done) => {
      nock(refocusUrl, {
        reqheaders: { authorization: accessToken },
      })
      .post('/v1/collectors/collector1/start')
      .reply(201, { collectorToken });

      start.execute(
        collectorName, refocusUrl, accessToken,
        { refocusProxy, dataSourceProxy }
      )
      .then(() => {
        const config = configModule.getConfig();
        expect(config.name).to.equal(collectorName);
        expect(config.refocus.url).to.equal(refocusUrl);
        expect(config.refocus.collectorToken).to.equal(collectorToken);
        expect(config.refocus.proxy).to.equal(refocusProxy);
        expect(config.dataSourceProxy).to.equal(dataSourceProxy);
        expect(repeater.tracker).to.have.property('Heartbeat');
        repeater.stop('Heartbeat');
        done();
      })
      .catch((err) => done(err));
    });

    it('ok, refocus proxy used in request if provided', (done) => {
      nock(refocusUrl, {
        reqheaders: { authorization: accessToken },
      })
      .post('/v1/collectors/collector1/start')
      .reply(201, { collectorToken });

      const spy = sinon.spy(request, 'post');
      start.execute(
        collectorName, refocusUrl, accessToken,
        { refocusProxy, dataSourceProxy }
      )
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(refocusProxy);
        repeater.stop('Heartbeat');
        spy.restore();
        done();
      })
      .catch((err) => {
        spy.restore();
        done(err);
      });
    });

    it('ok, proxy not used in request if not provided', (done) => {
      nock(refocusUrl, {
        reqheaders: { authorization: accessToken },
      })
      .post('/v1/collectors/collector1/start')
      .reply(201, { collectorToken });

      const spy = sinon.spy(request, 'post');
      start.execute(
        collectorName, refocusUrl, accessToken,
        { dataSourceProxy }
      )
      .then(() => {
        expect(spy.returnValues[0]._proxyUri).to.be.equal(undefined);
        spy.restore();
        done();
      })
      .catch((err) => {
        spy.restore();
        done(err);
      });
    });
  });

  it('heartbeat repeater fails?' /* , (done) => {
    start.execute();
    // TODO confirm that error was logged and thrown
    done();
  } */);
});
