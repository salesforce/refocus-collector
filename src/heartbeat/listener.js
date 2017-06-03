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
  if (err) {
    logger.error('The handleHeartbeatResponse function was called with an ' +
      'error:', err);
    return err;
  }

  // Update the collector config.
  if (res.collectorConfig) {
    debug('Heartbeat response collectorConfig to update', res.collectorConfig);
    debug('Collector config before updating', config.collectorConfig);
    Object.keys(res.collectorConfig).forEach((key) => {
      config.collectorConfig[key] = res.collectorConfig[key];
    });
    debug('Collector config after updating', config.collectorConfig);
  }

  if (res.generatorsAdded) {
    if (Array.isArray(res.generatorsAdded)) {
      // call repeat to setup a new repeat
      res.generatorsAdded.forEach((generator) => {
        repeater.createGeneratorRepeater(generator);
        config.generators[generator.name] = generator;
      });

      debug('Added generators to the config:', res.generatorsAdded);
    } else {
      logger.error('generatorsAdded attribute should be an array');
    }
  }

  if (res.generatorsDeleted) {
    if (Array.isArray(res.generatorsDeleted)) {
      /*
       * Stop the repeater for each of these generators, then delete from
       * config.
       */
      res.generatorsDeleted.forEach((g) => {
        repeater.stop(g.name);
        delete config.generators[g.name];
      });

      debug('Deleted generators from the config: ', res.generatorsDeleted);
    } else {
      logger.error('generatorsDeleted attribute must be an array');
    }
  }

  if (res.generatorsUpdated) {
    if (Array.isArray(res.generatorsDeleted)) {
      /*
       * Update the repeater for each of these generators, then update the
       * config.
       */
      res.generatorsUpdated.forEach((g) => {
        repeater.updateGeneratorRepeater(g);
        Object.keys(g).forEach((key) => {
          config.generators[g.name][key] = g[key];
        });
      });

      debug('Updated generators in the config: ', res.generatorsUpdated);
    } else {
      logger.error('generatorsDeleted attribute should be an array');
    }
  }

  return config;
} // handleHeartbeatResponse

module.exports = {
  handleHeartbeatResponse,
};
