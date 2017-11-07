/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/deregister.js
 *
 * Command execution for the "deregister" command.
 */
const debug = require('debug')('refocus-collector:commands');

/**
 * The "deregister" command logs the appropriate message.
 */
function execute(name) {
  debug('Entered deregister.execute');
} // execute

module.exports = {
  execute,
};
