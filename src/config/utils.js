/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/utils.js
 *
 * Configuration Initialization
 */
const debug = require('debug')('refocus-collector:config');
const common = require('../utils/commonUtils');
const errors = require('../errors');

/**
 * Initialize the config object.
 *
 * @returns {Object} - Config object
 */
function init(reg) {
  const conf = {
    collectorConfig: {
      heartbeatInterval: 15000, // TODO remove me once it's coming from refocus
      maxSamplesPerBulkRequest: 100, // TODO remove me once it's coming from refocus
      // TODO remove me once it's coming from refocus
      sampleUpsertQueueTime: 5000, // in milliseconds
    },
    generators: {},
  };

  const metadata = common.getCurrentMetadata();
  Object.assign(conf.collectorConfig, metadata);

  debug('Initialized config: %s', JSON.stringify(conf));
  return conf;
} // init

module.exports = {
  init,
};
