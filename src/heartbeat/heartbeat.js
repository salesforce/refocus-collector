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
const configModule = require('../config/config');
const listener = require('./listener');
const httpUtils = require('../utils/httpUtils');
const u = require('../utils/commonUtils');
const heartbeatCutoffPercentage =
  require('../constants').heartbeatCutoffPercentage;

/**
 * Send a heartbeat to the Refocus server
 * @returns {Promise<Request>} - the request sent to the Refocus server
 */
module.exports = () => {
  debug('Entered heartbeat');
  const timestamp = Date.now();
  const config = configModule.getConfig();
  const cr = config.refocus;
  const sanitized = u.sanitize(cr, configModule.attributesToSanitize);
  debug('heartbeat config.refocus %O', sanitized);
  const urlToPost = `${cr.url}/v1/collectors/${config.name}/heartbeat`;
  const cutoff = cr.heartbeatIntervalMillis * heartbeatCutoffPercentage;
  const requestBody = {
    timestamp,
    collectorConfig: u.getCurrentMetadata(),
  };

  return httpUtils.doPost(urlToPost, cr.collectorToken, cr.proxy, requestBody,
    cutoff)
    .then((res) => listener.onSuccess(res.body, timestamp))
    .catch(listener.onError);
};
