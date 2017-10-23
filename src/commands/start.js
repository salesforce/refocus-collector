/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/start.js
 *
 * Command execution for the "start" command. Primary responsibility is to
 * start the heartbeat repeater.
 */
const debug = require('debug')('refocus-collector:commands');
const logger = require('winston');
const configModule = require('../config/config');
const repeater = require('../repeater/repeater');
const sendHeartbeat = require('../heartbeat/heartbeat').sendHeartbeat;
const registryFile = require('../constants').registryLocation;
const registryFileUtils = require('../utils/registryFileUtils');

/**
 * The "start" command creates the heartbeat repeater.
 *
 * @throws TODO
 */
function execute(name) {
  debug('Entered start.execute');
  configModule.setRegistry();
  const config = configModule.getConfig();
  const regObj = registryFileUtils.getRefocusInstance(name, registryFile);

  /*
   * TODO: Replace the success/failure/progress listeners here with proper
   * logging once we have heartbeat
   */
  repeater.create({
    name: 'Heartbeat',
    interval: config.collectorConfig.heartbeatInterval,
    func: () => sendHeartbeat(regObj),
    onSuccess: debug,
    onFailure: debug,
    onProgress: debug,
  });

  logger.info({ activity: 'cmdStart' });
  debug('Exiting start.execute');
} // execute

module.exports = {
  execute,
};
