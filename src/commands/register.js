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
 * Command execution for the "register" command.
 */
const debug = require('debug')('refocus-collector:commands');
const logger = require('winston');
const config = require('../config/config');
const fs = require('fs');

/**
 * The "register" command logs the message.
 */
function execute(name, url, token) {
  debug('Entered register.execute');
} // execute

module.exports = {
  execute,
};
