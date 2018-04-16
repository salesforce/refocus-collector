/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/pause.js
 */
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const fork = require('child_process').fork;

describe('test/commands/pause >', () => {
  const collectorName = 'collector1';
  const refocusUrl = 'http://www.refocus-pause-test.com';
  const accessToken = 'abcdefghijklmnopqrstuvwxyz';
  const refocusProxy = 'http://abcproxy.com';
  const missingCollectorNameError =
    'error: You must specify a collector name.\n';
  const missingUrlError =
    'error: You must specify the url of the refocus instance.\n';
  const missingTokenError = 'error: You must specify an access token.\n';
  const cmd = 'src/commands/refocus-collector-pause.js';
  const silence = { silent: true };

  it('ok', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', accessToken, '--refocusProxy', refocusProxy,
    ];
    const pause = fork(cmd, args, silence);
    pause.on('close', (code) => {
      expect(code).to.equal(0);
      done();
    });
  });

  it('no collectorName', (done) => {
    const args = [
      '--refocusUrl', refocusUrl, '--accessToken', accessToken,
    ];
    const pause = fork(cmd, args, silence);
    pause.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(missingCollectorNameError));
    pause.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no refocusUrl', (done) => {
    const args = [
      '--collectorName', collectorName, '--accessToken', accessToken,
    ];
    const pause = fork(cmd, args, silence);
    pause.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(missingUrlError));
    pause.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no accessToken', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
    ];
    const pause = fork(cmd, args, silence);
    pause.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(missingTokenError));
    pause.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('ok, no refocusProxy', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', accessToken,
    ];
    const pause = fork(cmd, args, silence);
    pause.on('close', (code) => {
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
    const pause = fork(cmd, args, opts);
    pause.on('close', (code) => {
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
    const pause = fork(cmd, args, opts);
    pause.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(missingTokenError));
    pause.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });
});
