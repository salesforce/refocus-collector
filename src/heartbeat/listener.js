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

function onError(err) {
  try {
    debug('heartbeat error %O', err);
    logger.error('heartbeat error: ', err.message);

    // Pause all the repeater generators until successful heartbeat.
    repeater.pauseGenerators();
    pausedAfterHeartbeatError = true;
    return err; // returning the error here just for testability
  } catch (err) {
    /*
     * Catching and handling here so it doesn't bubble up and get caught by
     * heartbeat.js, which should only be catching errors from the POST.
     */
    debug('heartbeat listener.onError error %O', err);
    logger.error('heartbeat listener.onError error: ', err.message);
    return err; // returning the error here just for testability
  }
} // onError

/**
 * Handle the heartbeat response:
 *  1. Update the collector config if the config has changed.
 *  2. Start, delete and update the generator repeaters as needed.
 *
 * @param {Object} err - Error from the heartbeat response
 * @param {Object} res - Heartbeat response body
 * @returns {Object} - config object. An error object is returned if this
 *  function is called with the error as the first argument.
 */
module.exports = (err, res) => {
  debug('entered heartbeat listener %s', (err ? 'with error' : ''));
  if (err) return onError(err);
  try {
    const config = configModule.getConfig();
    if (res && res.collectorConfig) {
      const cc = res.collectorConfig;
      utils.changeCollectorStatus(config.refocus.status, cc.status);
      utils.updateCollectorConfig(cc);
      if (cc.status === collectorStatus.RUNNING) {
        utils.addGenerators(res);
        utils.deleteGenerators(res);
        utils.updateGenerators(res);
      }
    }

    // Resume all the repeater generators if paused due to failed heartbeat.
    if (pausedAfterHeartbeatError) {
      repeater.resumeGenerators();
      pausedAfterHeartbeatError = false;
    }

    const sanitized = sanitize(config, configModule.attributesToSanitize);
    debug('exiting heartbeat listener %O', sanitized);
    return config; // returning the config here just for testability
  } catch (err) {
    /*
     * Catching and handling here so it doesn't bubble up and get caught by
     * heartbeat.js, which should only be catching errors from the POST.
     */
    debug('heartbeat listener error %O', err);
    logger.error('heartbeat listener error: ', err.message);
    return err; // returning the error here just for testability
  }
};
