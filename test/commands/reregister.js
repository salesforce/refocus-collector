/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * test/commands/reregister.js
 */
'use strict';

const expect = require('chai').expect;
const nock = require('nock');
const fork = require('child_process').fork;
const httpStatus = require('../../src/constants.js').httpStatus;

describe('test/commands/reregister >', () => {
  const collectorName = 'collector1';
  const refocusUrl = 'http://www.example.com';
  const accessToken = 'abcdefghijklmnopqrstuvwxyz';
  const invalidToken = 'aaa';
  const collectorToken = 'zyxwvutsrqponmlkjihgfedcba';
  const refocusProxy = 'http://abcproxy.com';

  const missingCollectorNameError = 'error: You must specify a collector name\n';
  const missingUrlError = 'error: You must specify the url of the refocus instance\n';
  const missingTokenError = 'error: You must specify an access token\n';

  before(() => {
    nock(refocusUrl, {
      reqheaders: { authorization: accessToken },
    })
    .post('/v1/collectors/collector1/reregister')
    .reply(httpStatus.OK, { collectorToken });

    nock(refocusUrl, {
      reqheaders: { authorization: invalidToken },
    })
    .post('/v1/collectors/collector1/reregister')
    .reply(httpStatus.UNAUTHORIZED);
  });

  it('ok', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', accessToken, '--refocusProxy', refocusProxy,
    ];
    const opts = { silent: true };
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.on('close', (code) => {
      expect(code).to.equal(0);
      done();
    });
  });

  it('no collectorName', (done) => {
    const args = [
      '--refocusUrl', refocusUrl, '--accessToken', accessToken,
    ];
    const opts = { silent: true };
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingCollectorNameError);
    });
    reregister.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no refocusUrl', (done) => {
    const args = [
      '--collectorName', collectorName, '--accessToken', accessToken,
    ];
    const opts = { silent: true };
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingUrlError);
    });
    reregister.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('no accessToken', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
    ];
    const opts = { silent: true };
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingTokenError);
    });
    reregister.on('close', (code) => {
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
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.on('close', (code) => {
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
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.on('close', (code) => {
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
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.stderr.on('data', (data) => {
      expect(data.toString()).to.equal(missingTokenError);
    });
    reregister.on('close', (code) => {
      expect(code).to.equal(1);
      done();
    });
  });

  it('post returns error', (done) => {
    const args = [
      '--collectorName', collectorName, '--refocusUrl', refocusUrl,
      '--accessToken', invalidToken,
    ];
    const opts = { silent: true };
    const reregister = fork('src/commands/refocus-collector-reregister.js', args, opts);
    reregister.stderr.on('data', (data) => {
      if (data.toString().indexOf('error') >= 0) {
        expect(data.toString()).to.include('error');
      }
    });
    reregister.on('close', (code) => {
      expect(code).to.equal(0);
      done();
    });
  });
});
