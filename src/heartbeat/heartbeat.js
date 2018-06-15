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
const listener = require('./listener');
const httpUtils = require('../utils/httpUtils');
const u = require('../utils/commonUtils');
const sanitize = u.sanitize;

/**
 * Send a heartbeat to the Refocus server
 * @returns {Request} - the request sent to the Refocus server
 */
module.exports = () => {
  debug('Entered heartbeat');
  const timestamp = Date.now();
  const config = configModule.getConfig();
  const sanitized = sanitize(config.refocus, ['accessToken', 'collectorToken']);
  debug('heartbeat config.refocus %O', sanitized);
  const collectorName = config.name;
  const refocusUrl = config.refocus.url;
  const collectorToken = config.refocus.collectorToken;
  const proxy = config.refocus.proxy;
  const heartbeatEndpoint = `/v1/collectors/${collectorName}/heartbeat`;
  const urlToPost = refocusUrl + heartbeatEndpoint;
  const cutOff = config.refocus.heartbeatIntervalMillis / 2; // half of length of heartbeat

  const existing = configModule.getConfig().metadata;
  const current = u.getCurrentMetadata();
  const changed = u.getChangedMetadata(existing, current);
  Object.assign(existing, current);
  const requestbody = {
    timestamp,
    collectorConfig: changed,
  };

  return httpUtils.doPost(urlToPost, collectorToken, proxy, requestbody, cutOff)
  .then((res) => listener(null, res.body))
  .catch((err) => listener(err, null));
};
