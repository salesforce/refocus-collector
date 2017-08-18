/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/config.js
 *
 * Configuration Settings - Exports getter and setter to get and set the
 * registry information
 */
const debug = require('debug')('refocus-collector:config');
const init = require('./utils').init;
const oauth2 = require('simple-oauth2');

/**
 * Config object created by loading local registry. This object is also
 * updated by the response from the hearbeat.
 * @type {Object}
 */
let config;

/**
 * Function to clear the config object.
 */
function clearConfig() {
  config = null;
} // clearConfig

/**
 * Initialize the config object. If the "reg" argument is an object, it is
 * assigned as the config registry. If the "reg" argument is a string, treat
 * it is a file location and try to assign the file contents as the config
 * registry.
 *
 * @param {String|Object} reg - Registry object or location of registry file
 */
function setRegistry(reg) {
  if (!config) {
    config = init(reg);
    debug('Initialized config: %o', config);
  }
} // setRegistry

/**
 * Returns the config object
 * @returns {Object} Config Object
 */
function getConfig(tokenObject=null) {
  if (tokenObject) {
  	return oauth2.accessToken.create(tokenObject);
  }

  return config;
} // getConfig

module.exports = {
  setRegistry,
  getConfig,
  clearConfig, // exported for testing
};
