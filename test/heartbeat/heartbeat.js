/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/heartbeat/heartbeat.js
 */
'use strict';
require('../../src/config/config').setRegistry({ registry: {} });
const config = require('../../src/config/config').getConfig();
const expect = require('chai').expect;
const heartbeat = require('../../src/heartbeat/heartbeat');
const sendHeartbeat = heartbeat.sendHeartbeat;

describe('test/heartbeat/heartbeat.js >', () => {
  const url = 'https://www.example.com';
  const token = 'cCI6IkpXV5ciOiJIUzI1CJ9eyJhbGNiIsInR';
  const collectorName = 'exampleCollector';

  it('sendHeartbeat', (done) => {
    config.registry[collectorName] = {
      url: url,
      token: token,
    };

    const request = sendHeartbeat();
    expect(request).to.exist;
    expect(request.method).to.equal('POST');
    expect(request.url).to.equal(`${url}/v1/collectors/${collectorName}/heartbeat`);
    expect(request.header.Authorization).to.equal(token);
    expect(request._data).to.deep.equal({ logLines: [] });
    done();
  });

  it('sendHeartbeat - missing token', (done) => {
    config.registry[collectorName] = {
      url: url,
      token: null,
    };

    const request = sendHeartbeat();
    expect(request).to.exist;
    expect(request.method).to.equal('POST');
    expect(request.url).to.equal(`${url}/v1/collectors/${collectorName}/heartbeat`);
    expect(request.header.Authorization).to.be.null;
    expect(request._data).to.deep.equal({ logLines: [] });
    done();
  });

  it('sendHeartbeat - missing url', (done) => {
    config.registry[collectorName] = {
      url: null,
      token: token,
    };

    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - missing url', (done) => {
    config.registry[collectorName] = {
      token: token,
    };

    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - empty registry', (done) => {
    config.registry = {};
    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

  it('sendHeartbeat - missing registry', (done) => {
    delete config.registry;
    try {
      sendHeartbeat();
    } catch (err) {
      expect(err.name).to.equal('ValidationError');
      done();
    }
  });

});
