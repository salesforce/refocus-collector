/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /src/config.js
 */

const collectorConfig = {

};

const generators = { };

/**
 * [updateCollectorConfig description]
 * @param  {[type]} configObj [description]
 * @returns {[type]}           [description]
 */
function updateCollectorConfig(configObj) {
  if (!configObj) {
    return null;
  }

  Object.keys(configObj).forEach((key) => {
    collectorConfig[key] = configObj[key];
  });

  return configObj;
} // updateCollectorConfig

module.exports = {

  collectorConfig,

  generators,

  updateCollectorConfig,
}; // module.exports
