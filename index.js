/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * index.js
 *
 * Main module for the refocus-collector.
 *
 * Load the registry, and execute the start command.
 */
const debug = require('debug')('refocus-collector');
const logger = require('winston');
const constants = require('./src/constants');
const cmdStart = require('./src/commands/start');
const conf = require('./src/config/config');

try {
  conf.setRegistry(constants.registryLocation);
  cmdStart.execute();
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}
