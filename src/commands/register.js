/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/register.js
 *
 * Command execution for the "register" command. Primary responsibility is to
 * register the collector in registry file.
 */
const debug = require('debug')('refocus-collector:commands');
const logger = require('winston');
const config = require('../config/config');
const fs = require('fs');
const registryFile = require('../constants').registryLocation;

/**
 * Add registryObj to registry file.
 *
 * @param {String} refocusName - Refocus instance name
 * @param {Object} refocusDetails - Refocus URL and token
 *
 * @throws error if file is not created or adding refocus instance
 *   failed
 */
function appendObject(refocusName, refocusDetails, file) {
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    registryData[refocusName] = refocusDetails;
    const configJSON = JSON.stringify(registryData, null, 2);
    fs.writeFileSync(file, configJSON);
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

/**
 * Create Registry Object using Refocus URL and token.
 *
 * @param {String} name - Refocus instance name @TODO currently not useful
    and in future it will be useful
 * @param {String} url - Refocus URL
 * @param {String} token - Refocus token
 *
 * @return {Object} Refocus details object
 */
function createRegistryObject(name, url, token) {
  return {
    url: url,
    token: token,
  };
}

/**
 * The "register" command adds the entry into registry.json file.
 *
 * @throws TODO
 */
function execute(name, url, token) {
  debug('Entered register.execute');
  const registryObj = createRegistryObject(name, url, token);
  appendObject(name, registryObj, registryFile);
} // execute

module.exports = {
  appendObject,
  createRegistryObject,
  execute,
};
