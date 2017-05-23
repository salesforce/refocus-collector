/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./config.js
 *
 * Configuration Settings - Exports in-memory config object
 */
const debug = require('debug')('refocus-collector-config');
const cUtils = require('./src/utils/commonUtils');
const coreErrors = require('./src/errors/coreErrors');

// registry json file location
const registryLoc = './registry.json';

/**
 * Read registry.json and create config object which contains registryInfo
 * property.
 * @param  {String} registryFileLoc - Location of registry.json
 * @return {Promise} - Resolves to config object
 */
function createConfigObj(registryFileLoc) {
  return cUtils.readFile(registryFileLoc, 'utf8')
  .then(data => {
    const registryJson = JSON.parse(data);

    // read from registry and load registryInfo in config object.
    debug('Reading from file %s', registryFileLoc);
    for (const controllerName in registryJson) {
      if (!registryJson[controllerName].hasOwnProperty('url')) {

        // Throw error if url is not present for a collector entry in registry.
        debug('Error: url not found for collector entry: %s', controllerName);
        throw new coreErrors.ValidationError(
          'Collector entries in Regisry.json should have url property.'
        );
      }
    }

    // set registryInfo in config object
    const configObj = { registryInfo: registryJson };

    debug('Config object updated: %s', JSON.stringify(configObj));
    return configObj;
  })
  .catch((err) => {
    throw err;
  });
}

/**
 * promise to get config object with registry location:
 * ./registry.json
 * @type {promise}
 */
const getConfigObj = createConfigObj(registryLoc);

module.exports = {
  getConfigObj,
  createConfigObj,
};
