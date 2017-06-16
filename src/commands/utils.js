/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/utils.js
 */
const conf = require('../config/config');
const logger = require('winston');

/**
 * Register the collector and process any
 * refocus-collector commands.
 *
 * @param {Object} program From the command npm module.
 * @param {Object} collectorObject Contains registry info
 */
function setRegistryAndParseCommand(program, collectorObject) {
  try {
    conf.setRegistry(collectorObject);
    program.parse(process.argv);
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

module.exports = {
  setRegistryAndParseCommand,
};
