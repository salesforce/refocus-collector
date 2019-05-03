/**
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/generatorsGlobal.js
 *
 * Generator Global Settings - Exports getter and setter to get and set
 * the shared settings among generator clones
 */

/**
 * Generators global object.
 * @type {Object}
 */
let generatorsGlobal;

/**
 * Initialize the generator config object.
 */
function initializeGeneratorsGlobal() {
  generatorsGlobal = {};
} // initializeGeneratorsConfig

/**
 * @param {String} name - Generator name
 * @param {String} key - Generator obj property key
 * @returns {String} - Obj property value if present, otherwise null
 */
function getGeneratorGlobal(name, key) {
  if (generatorsGlobal[name] && generatorsGlobal[name][key]) {
    return generatorsGlobal[name][key];
  }

  return null;
} // getGeneratorGlobal

/**
 * @param {String} name - Generator name
 * @param {String} key - Generator obj property key
 * @param {Object} value - Value to update
 */
function updateGeneratorGlobal(name, key, value) {
  if (!generatorsGlobal[name]) {
    generatorsGlobal[name] = {};
  }

  generatorsGlobal[name][key] = value;
} // updateGeneratorGlobal

module.exports = {
  getGeneratorGlobal,
  initializeGeneratorsGlobal,
  updateGeneratorGlobal,
};
