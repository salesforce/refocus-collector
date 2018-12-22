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
const sanitize = require('../utils/commonUtils').sanitize;
const repeater = require('../repeater/repeater');

let pausedAfterHeartbeatError = false;

/**
 * Handle heartbeat error by pausing all the generator repeaters and setting
 * pausedAfterHeartbeatError to true, so that they will be resumed on the next
 * successful heartbeat.
 *
 * @param {Object} err - Error from the heartbeat response
 * @returns {Error} - returning this just for testability
 */
function onError(err) {
  debug('heartbeat/listener.onError: %O', err);
  logger.error('heartbeat error: ', err.message);
  if (!pausedAfterHeartbeatError) {
    repeater.pauseGenerators();
    pausedAfterHeartbeatError = true;
  }
  return err;
} // onError

/**
 * Handle the heartbeat response:
 *  1. Update the collector config if the config has changed.
 *  2. Start, delete and update the generator repeaters as needed.
 *  3. If generator repeaters were paused after a failed heartbeat, resume
 *     them now.
 *
 * @param {Object} body - Heartbeat response body
 * @returns {Object} - Config object or error (returning just for testability)
 */
function onSuccess(body, timestamp) {
  debug('heartbeat/listener.onSuccess', body);
  try {
    const config = configModule.getConfig();
    if (body && body.collectorConfig) {
      const cc = body.collectorConfig;
      utils.changeCollectorStatus(config.refocus.status, cc.status);
      utils.updateCollectorConfig(cc);
      body.timestamp = timestamp;
      if (cc.status === collectorStatus.RUNNING) {
        utils.addGenerators(body);
        utils.deleteGenerators(body);
        utils.updateGenerators(body);
      }
    }

    // Resume all the repeater generators if paused due to failed heartbeat.
    if (pausedAfterHeartbeatError) {
      repeater.resumeGenerators();
      pausedAfterHeartbeatError = false;
    }

    const sanitized = sanitize(config, configModule.attributesToSanitize);
    debug('exiting heartbeat/listener.onSuccess %O', sanitized);
    return config; // returning the config here just for testability
  } catch (err) {
    /*
     * Catching and handling here so it doesn't bubble up and get caught by
     * heartbeat.js, which should only be catching errors from the POST.
     */
    debug('heartbeat/listener.onSuccess error %O', err);
    logger.error('Error in heartbeat/listener.onSuccess: ', err.message);
    return err; // returning the error here just for testability
  }
} // onSuccess

module.exports = {
  onError,
  onSuccess,
};
