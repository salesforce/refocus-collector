/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/heartbeat.js
 */
'use strict'; // eslint-disable-line strict
const debug = require('debug')('refocus-collector:heartbeat');
const request = require('superagent');
const configModule = require('../config/config');
const handleHeartbeatResponse = require('./listener').handleHeartbeatResponse;
const fs = require('fs');
const Promise = require('bluebird');
Promise.promisifyAll(fs);
const u = require('../utils/commonUtils');

/**
 * Send a heartbeat to the Refocus server
 * @returns {Request} - the request sent to the Refocus server
 */
function sendHeartbeat() {
  debug('Entered heartbeat.sendHeartbeat');
  const timestamp = Date.now();
  const config = configModule.getConfig();
  const sanitized = JSON.parse(JSON.stringify(config.refocus));
  if (sanitized.accessToken) {
    sanitized.accessToken = '...' + sanitized.accessToken.slice(-5);
  }

  if (sanitized.collectorToken) {
    sanitized.collectorToken = '...' + sanitized.collectorToken.slice(-5);
  }

  debug('sendHeartbeat config.refocus', sanitized);
  const collectorName = config.name;
  const refocusUrl = config.refocus.url;
  const accessToken = config.refocus.accessToken;
  const proxy = config.refocus.proxy;
  const heartbeatEndpoint = `/v1/collectors/${collectorName}/heartbeat`;
  const urlToPost = refocusUrl + heartbeatEndpoint;

  const existing = configModule.getConfig().metadata;
  const current = u.getCurrentMetadata();
  const changed = u.getChangedMetadata(existing, current);
  Object.assign(existing, current);
  const requestbody = {
    timestamp,
    collectorConfig: changed,
  };

  const req = request.post(urlToPost)
    .send(requestbody)
    .set('Authorization', accessToken);
  if (proxy) {
    req.proxy(proxy); // set proxy for following request
  }

  return req.then((res) => handleHeartbeatResponse(null, res.body))
  .catch((err) => handleHeartbeatResponse(err, null));
}

module.exports = {
  sendHeartbeat,
};
