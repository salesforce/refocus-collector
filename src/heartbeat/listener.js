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
const config = require('../config/config');
const repeater = require('../repeater/repeater');

/**
 * This handles the heartbeat response by doing the following,
 * 1. Updates the collector config if the config has changed.
 * 2. Starts, deletes and updates the generator repeaters if it has changed.
 * @param  {Object} err - Error from the heartbeat response
 * @param  {Object} res - Heartbeat response
 * @returns {Object} - config object
 */
function handleHeartbeatResponse(err, res) {
  if (err) {

    return err;
  }

  // update the collector config from heartbeat
  if (res.collectorConfig) {
    Object.keys(res.collectorConfig).forEach((key) => {
      config[key] = res.collectorConfig[key];
    });
    debug('collector config updated');
  }

  if (res.generatorsAdded && Array.isArray(res.generatorsAdded)) {
    // call repeat to setup a new repeat
    res.generatorsAdded.forEach((generator) => {
      repeater.startNewGeneratorRepeat(generator);
      config.generators[generator.name] = generator;
    });

    debug(`Done adding generators added to the config: ${res.generatorsAdded}`);
  }

  if (res.generatorsDeleted && Array.isArray(res.generatorsDeleted)) {
    // call repeat to delete a repeat
    res.generatorsDeleted.forEach((generator) => {
      repeater.stopRepeat(generator);
      delete config.generators[generator];
    });

    debug(`Done deleting generators from the config: ${res.generatorsDeleted}`);
  }

  if (res.generatorsUpdated && Array.isArray(res.generatorsUpdated)) {
    // call repeat to delete the repeat, followed by creating it again
    res.generatorsUpdated.forEach((generator) => {
      repeater.updateGeneratorRepeat(generator);
      Object.keys(generator).forEach((key) => {
        config.generators[generator.name][key] = generator[key];
      });
    });
    debug(`Done updating generators in the config: ${res.generatorsUpdated}`);
  }

  return config;
} // handleHeartbeatResponse

module.exports = {
  handleHeartbeatResponse,
};
