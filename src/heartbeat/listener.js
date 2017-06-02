/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /heartbeat/listener.js
 */
const debug = require('debug')('refocus-collector:heartbeat');
const config = require('../config/config').getConfig();
const repeater = require('../repeater/repeater');
const logger = require('winston');

/**
 * This handles the heartbeat response by doing the following,
 * 1. Updates the collector config if the config has changed.
 * 2. Starts, deletes and updates the generator repeaters if it has changed.
 * @param  {Object} err - Error from the heartbeat response
 * @param  {Object} res - Heartbeat response
 * @returns {Object} - config object. An error object is returned if this
 * function is called with the error as the first argument.
 */
function handleHeartbeatResponse(err, res) {
  if (err) {
    logger.log('error', 'the handleHeartbeatResponse function was called ' +
      'with an error:', err);
    return err;
  }

  // update the collector config from heartbeat
  if (res.collectorConfig) {
    Object.keys(res.collectorConfig).forEach((key) => {
      config[key] = res.collectorConfig[key];
    });
    debug('Collector config updated');
  }

  if (res.generatorsAdded) {
    if (Array.isArray(res.generatorsAdded)) {
      // call repeat to setup a new repeat
      res.generatorsAdded.forEach((generator) => {
        repeater.startNewGeneratorRepeat(generator);
        config.generators[generator.name] = generator;
      });

      debug('Added generators to the config:', res.generatorsAdded);
    } else {
      logger.log('error', 'generatorsAdded attribute should be an array');
    }
  }

  if (res.generatorsDeleted) {
    if (Array.isArray(res.generatorsDeleted)) {
      // call repeat to delete a repeat
      res.generatorsDeleted.forEach((generator) => {
        repeater.stopRepeat(generator);
        delete config.generators[generator.name];
      });

      debug('Deleted generators from the config: ', res.generatorsDeleted);
    } else {
      logger.log('error', 'generatorsDeleted attribute should be an array');
    }
  }

  if (res.generatorsUpdated) {
    if (Array.isArray(res.generatorsDeleted)) {
      // call repeat to update the repeat
      res.generatorsUpdated.forEach((generator) => {
        repeater.updateGeneratorRepeat(generator);
        Object.keys(generator).forEach((key) => {
          config.generators[generator.name][key] = generator[key];
        });
      });

      debug('Updated generators in the config: ', res.generatorsUpdated);
    } else {
      logger.log('error', 'generatorsDeleted attribute should be an array');
    }
  }

  return config;
} // handleHeartbeatResponse

module.exports = {
  handleHeartbeatResponse,
};
