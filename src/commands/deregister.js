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
 * Command execution for the "deregister" command. Primary responsibility is to
 * register the collector in registry file.
 */
const debug = require('debug')('refocus-collector:commands');
const registryFile = require('../constants').registryLocation;
const registryFileUtils = require('../utils/registryFileUtils');
const configModule = require('../config/config');

/**
 * The "deregister" command removes the entry into registry.json file.
 *
 * @throws TODO
 */
function execute(name) {
  debug('Entered deregister.execute');
  registryFileUtils.removeRegistry(name, registryFile);
  delete configModule.getConfig().registry.refocusInstances[name];
} // execute

module.exports = {
  execute,
};
