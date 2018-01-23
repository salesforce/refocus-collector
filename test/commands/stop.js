/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/stop.js
 */
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const fork = require('child_process').fork;

describe('test/commands/stop >', () => {
  const collectorName = 'collector1';
  const refocusUrl = 'http://www.refocus-stop-test.com';
  const accessToken = 'abcdefghijklmnopqrstuvwxyz';
  const refocusProxy = 'http://abcproxy.com';
  const missingCollectorNameError = 'error: You must specify a ' +
    'collector name.\n';
  const missingUrlError = 'error: You must specify the url of the ' +
    'refocus instance.\n';
  const missingTokenError = 'error: You must specify an access token.\n';

  it('ok', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', accessToken, '--refocusProxy', refocusProxy,
    ];
    const opts = { silent: true };
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.on('close', (code) => {
      expect(code).to.equal(0);
      done();
    });
  });

  it('no collectorName', (done) => {
    const args = [
      '--refocusUrl', refocusUrl, '--accessToken', accessToken,
    ];
    const opts = { silent: true };
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingCollectorNameError);
    });
    stop.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no refocusUrl', (done) => {
    const args = [
      '--collectorName', collectorName, '--accessToken', accessToken,
    ];
    const opts = { silent: true };
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingUrlError);
    });
    stop.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no accessToken', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
    ];
    const opts = { silent: true };
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingTokenError);
    });
    stop.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('ok, no refocusProxy', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', accessToken,
    ];
    const opts = { silent: true };
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.on('close', (code) => {
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
      },
    };
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.on('close', (code) => {
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
    const stop = fork('src/commands/refocus-collector-stop.js',
      args, opts);
    stop.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingTokenError);
    });
    stop.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });
});
