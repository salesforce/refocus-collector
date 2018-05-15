/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/resume.js
 */
'use strict'; // eslint-disable-line strict
const expect = require('chai').expect;
const fork = require('child_process').fork;
const constants = require('./constants');

describe('test/commands/resume.js >', () => {
  const collectorName = 'collector1';
  const refocusUrl = 'http://www.refocus-resume-test.com';
  const accessToken = 'abcdefghijklmnopqrstuvwxyz';
  const refocusProxy = 'http://abcproxy.com';
  const cmd = 'src/commands/refocus-collector-resume.js';

  it('ok', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', accessToken, '--refocusProxy', refocusProxy,
    ];
    const resume = fork(cmd, args, constants.silence);
    resume.on('close', (code) => {
      expect(code).to.equal(0);
      done();
    });
  });

  it('no collectorName', (done) => {
    const args = [
      '--refocusUrl', refocusUrl, '--accessToken', accessToken,
    ];
    const resume = fork(cmd, args, constants.silence);
    resume.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(constants.error.missingCollectorName));
    resume.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no refocusUrl', (done) => {
    const args = [
      '--collectorName', collectorName, '--accessToken', accessToken,
    ];
    const resume = fork(cmd, args, constants.silence);
    resume.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(constants.error.missingUrl));
    resume.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no accessToken', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
    ];
    const resume = fork(cmd, args, constants.silence);
    resume.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(constants.error.missingToken));
    resume.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('ok, no refocusProxy', (done) => {
    const args = [
      '--collectorName', collectorName,
      '--refocusUrl', refocusUrl,
      '--accessToken', accessToken,
    ];
    const resume = fork(cmd, args, constants.silence);
    resume.on('close', (code) => {
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
    const resume = fork(cmd, args, opts);
    resume.on('close', (code) => {
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
    const resume = fork(cmd, args, opts);
    resume.stderr.on('data', (data) =>
      expect(data.toString()).to.equal(constants.error.missingToken));
    resume.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });
});
