/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/heartbeat/listener.js
 */
const debug = require('debug')('refocus-collector:heartbeat');
const logger = require('winston');
const utils = require('./utils');
const configModule = require('../config/config');
const queueUtils = require('../utils/queueUtils');
const httpUtils = require('../utils/httpUtils');
const bulkUpsertSampleQueue = require('../constants').bulkUpsertSampleQueue;

/**
 * Handles the heartbeat response:
 *  1. Update the collector config if the config has changed.
 *  2. Start, delete and update the generator repeaters as needed.
 *
 * @param {Object} err - Error from the heartbeat response
 * @param {Object} res - Heartbeat response
 * @returns {Object} - config object. An error object is returned if this
 *  function is called with the error as the first argument.
 */
function handleHeartbeatResponse(err, res) {
  debug('entered handleHeartbeatResponse');
  if (err) {
    logger.error('The handleHeartbeatResponse function was called with an ' +
      'error:', err);
    return err;
  }

  // queue generation
  // get queue
  const _bulkUpsertSampleQueue = queueUtils.getQueue(bulkUpsertSampleQueue);
  if (_bulkUpsertSampleQueue) {
    if (res.collectorConfig) {
      _bulkUpsertSampleQueue._size = res.collectorConfig.maxSamplesPerBulkRequest;
      _bulkUpsertSampleQueue._flushTimeout =
        res.collectorConfig.sampleUpsertQueueTime;
    }
  } else {
    const config = configModule.getConfig();
    const queueParams = {
      name: bulkUpsertSampleQueue,
      size: config.refocus.maxSamplesPerBulkRequest,
      flushTimeout: config.refocus.sampleUpsertQueueTime,
      verbose: false,
      flushFunction: httpUtils.doBulkUpsert,
    };
    queueUtils.createQueue(queueParams);
  }

  if (res) {
    utils.updateCollectorConfig(res);
    utils.addGenerator(res);
    utils.deleteGenerator(res);
    utils.updateGenerator(res);
  }

  const config = configModule.getConfig();
  debug('exiting handleHeartbeatResponse', config);
  return config;
} // handleHeartbeatResponse

module.exports = {
  handleHeartbeatResponse,
};
