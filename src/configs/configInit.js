/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/configs/configInit.js
 *
 * Configuration Initialization
 */
const debug = require('debug')('refocus-collector:configInit');
const cUtils = require('../utils/commonUtils');
const errors = require('../errors/errors');
const fs = require('fs');
const util = require('util');

/**
 * Read registry.json and create config object which contains registryInfo
 * property.
 * @param  {String} registryFileLoc - Location of registry.json
 * @return {Object} - Config object
 */
function createConfigObj(registryFileLoc) {

  // get file contents synchronously
  const fileContents = cUtils.readFileSynchr(registryFileLoc);
  const registryJson = JSON.parse(fileContents);

  // read from registry and load registryInfo in config object.
  debug('Reading from file %s', registryFileLoc);
  for (const controllerName in registryJson) {
    if (!registryJson[controllerName].hasOwnProperty('url')) {

      // Throw error if url is not present for a collector entry in registry.
      debug('Error: url not found for collector entry: %s', controllerName);
      throw new errors.ValidationError(
        'Collector entries in Regisry.json should have url property.'
      );
    }
  }

  // set registryInfo in config object
  const configObj = { registryInfo: registryJson };

  debug('Config object updated: %s', JSON.stringify(configObj));
  return configObj;
}

module.exports = {
  createConfigObj,
};
