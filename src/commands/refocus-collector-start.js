/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-start.js
 *
 * Calls the "start" command.
 */
const program = require('./index').program;
const args = program.args;

const debug = require('debug')('refocus-collector');
const logger = require('winston');
const constants = require('../constants');
const cmdStart = require('./start');
const conf = require('../config/config');

try {
  console.log('Start =>', args[0]);
  cmdStart.execute();
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}

