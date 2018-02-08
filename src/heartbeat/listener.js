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
'use strict'; // eslint-disable-line strict
const debug = require('debug')('refocus-collector:heartbeat');
const logger = require('winston');
const utils = require('./utils');
const configModule = require('../config/config');
const collectorStatus = require('../constants').collectorStatus;

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

  const config = configModule.getConfig();
  if (res && res.collectorConfig) {
    utils.changeCollectorStatus(config.refocus.status,
      res.collectorConfig.status);

    utils.updateCollectorConfig(res);

    if (res.collectorConfig.status === collectorStatus.RUNNING) {
      utils.addGenerators(res);
      utils.deleteGenerator(res);
      utils.updateGenerator(res);
    }
  }

  debug('exiting handleHeartbeatResponse', config);
  return config;
} // handleHeartbeatResponse

module.exports = {
  handleHeartbeatResponse,
};
