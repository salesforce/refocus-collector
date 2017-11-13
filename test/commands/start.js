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

describe('test/commands/start >', () => {
  const collectorName = 'collector1';
  const refocusUrl = 'http://www.example.com';
  const accessToken = 'abcdefghijklmnopqrstuvwxyz';
  const invalidToken = 'aaa';
  const collectorToken = 'zyxwvutsrqponmlkjihgfedcba';

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
        '--accessToken', accessToken,
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

    it('use environment variables if not specifed', (done) => {
      const args = [];
      const opts = {
        silent: true,
        env: {
          RC_COLLECTOR_NAME: collectorName,
          RC_REFOCUS_URL: refocusUrl,
          RC_ACCESS_TOKEN: accessToken,
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
    it('ok', (done) => {
      start.execute(collectorName, refocusUrl, accessToken)
      .then(() => {
        const config = configModule.getConfig();
        expect(config.collectorConfig.collectorName).to.equal(collectorName);
        expect(config.collectorConfig.refocusUrl).to.equal(refocusUrl);
        expect(config.collectorConfig.collectorToken).to.equal(collectorToken);
        expect(repeater.tracker).to.have.property('Heartbeat');
        done();
      });
    });

    it('post returns error', (done) => {
      start.execute(collectorName, refocusUrl, invalidToken)
      .then(() => done('expecting error'))
      .catch((err) => {
        expect(err.name).to.equal('CollectorStartError');
        expect(err.explanation).to.equal(
          'POST http://www.example.com/v1/collectors/collector1/start failed:' +
          ' 401 Unauthorized');
        done();
      });
    });
  });

  it('heartbeat repeater fails?' /* , (done) => {
    start.execute();
    // TODO confirm that error was logged and thrown
    done();
  } */);
});
