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

/**
 * Config object created by loading local registry. This object
 * is also updated by the response from the hearbeat.
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
 * Sets the registry attribute of the config object. If the argument passed
 * is an object, that object is assigned as the config.
 * If the argument is a string, it is assumed that it is a file location
 * and init is called to load the file
 * contents and assign it ot the config.
 * @param {String|Object} objOrString - An object or a string.
 */
function setRegsitry(objOrString) {
  if (!config) {
    config = typeof objOrString === 'object' ? objOrString : init(objOrString);
    config.generators = {};
    debug('Initialized config: %o', config);
  }
} // setRegsitry

/**
 * Returns the config object
 * @returns {Object} Config Object
 */
function getConfig() {
  return config;
} // getConfig

module.exports = {
  setRegsitry,
  getConfig, // exported for testing
  clearConfig, // exported for testing
};
