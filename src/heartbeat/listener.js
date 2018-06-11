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

/**
 * Handle the heartbeat response:
 *  1. Update the collector config if the config has changed.
 *  2. Start, delete and update the generator repeaters as needed.
 *
 * @param {Object} err - Error from the heartbeat response
 * @param {Object} res - Heartbeat response
 * @returns {Object} - config object. An error object is returned if this
 *  function is called with the error as the first argument.
 */
module.exports = (err, res) => {
  debug('entered heartbeat listener');
  if (err) {
    debug('heartbeat listener error %O', err);
    logger.error('The heartbeat listener was called with an error: ',
      err.message);
    return err;
  }

  const config = configModule.getConfig();
  if (res && res.collectorConfig) {
    console.log(res);
    const cc = res.collectorConfig;
    utils.changeCollectorStatus(config.refocus.status, cc.status);
    utils.updateCollectorConfig(cc);
    if (cc.status === collectorStatus.RUNNING) {
      utils.addGenerators(res);
      utils.deleteGenerators(res);
      utils.updateGenerators(res);
    }
  }

  const sanitized =
    sanitize(config, ['accessToken', 'collectorToken', 'token']);
  debug('exiting heartbeat listener %O', sanitized);
  return config;
};
