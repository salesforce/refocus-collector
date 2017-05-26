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
const errors = require('../errors/errors');
const fs = require('fs');
const util = require('util');

/**
 * Read registry.json and initialize config object with registry.
 *
 * @param {String} registryFileLoc - Location of registry.json
 * @return {Object} - Config object
 * @throws {ValidationError} - If a registry entry is missing a "url" attribute
 * @throws {ResourceNotFoundError} - Thrown by common.readFileSynchr
 */
function init(registryFileLoc) {
  // Get file contents synchronously.
  const fileContents = common.readFileSynchr(registryFileLoc);
  const registryJson = JSON.parse(fileContents);

  // Read from registry and load registryInfo in config object.
  debug('Reading from file %s', registryFileLoc);
  for (const controllerName in registryJson) {
    if (!registryJson[controllerName].hasOwnProperty('url')) {
      // Throw error if url is not present for a collector entry in registry.
      debug('Error: url not found for collector entry: %s', controllerName);
      throw new errors.ValidationError(
        'Collector entries in regisry.json must have "url" attribute.'
      );
    }
  }

  // Set config.registry.
  const conf = { registry: registryJson };
  debug('Initialized config: %s', JSON.stringify(conf));
  return conf;
} // init

module.exports = {
  init,
};
