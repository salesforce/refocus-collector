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
const logger = require('winston');
const get = require('just-safe-get');
const configModule = require('../config/config');
const listener = require('./listener');
const httpUtils = require('../utils/httpUtils');
const u = require('../utils/commonUtils');
const heartbeatCutoffPercentage =
  require('../constants').heartbeatCutoffPercentage;

/**
 * Send a heartbeat to the Refocus server
 * @returns {Request} - the request sent to the Refocus server
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
  const existing = config.metadata;
  const current = u.getCurrentMetadata();
  logger.info({
    activity: 'heartbeat',
    name: config.name,
    numGenerators: Object.keys(config.generators).length,
    rss: get(current, 'processInfo.memoryUsage.rss'),
    external: get(current, 'processInfo.memoryUsage.external'),
    heapUsed: get(current, 'processInfo.memoryUsage.heapUsed'),
    heapTotal: get(current, 'processInfo.memoryUsage.heapTotal'),
    uptime: get(current, 'processInfo.uptime'),
  });
  const changed = u.getChangedMetadata(existing, current);
  Object.assign(existing, current);
  const requestbody = {
    timestamp,
    collectorConfig: changed,
  };

  return httpUtils.doPost(urlToPost, cr.collectorToken, cr.proxy, requestbody,
    cutoff)
    .then((res) => listener.onSuccess(res.body, timestamp))
    .catch(listener.onError);
};
