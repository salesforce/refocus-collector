/**
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/generatorAuth.js
 *
 * Generator Authentication Settings - Exports getter and setter to get and set
 * the shared authentication settings among generator clones
 */

/**
 * Generator authentication object.
 * @type {Object}
 */
let generatorAuth;

/**
 * Initialize the generator authentication object.
 */
function initializeGeneratorAuth() {
  generatorAuth = {};
} // initializeGeneratorAuth

/**
 * @param {String} name - Generator name
 * @param {String} key - Generator obj property key
 * @returns {String} - Obj property value if present, otherwise null
 */
function getGeneratorAuth(name, key) {
  if (generatorAuth[name] && generatorAuth[name][key]) {
    return generatorAuth[name][key];
  }

  return null;
} // getGeneratorAuth

/**
 * @param {String} name - Generator name
 * @param {String} key - Generator obj property key
 * @param {Object} value - Value to update
 */
function updateGeneratorAuth(name, key, value) {
  if (!generatorAuth[name]) {
    generatorAuth[name] = {};
  }

  generatorAuth[name][key] = value;
} // updateGeneratorAuth

module.exports = {
  getGeneratorAuth,
  initializeGeneratorAuth,
  updateGeneratorAuth,
};
