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
const constants = require('../constants');
const config = require('../config/config');
const repeater = require('../repeater/repeater');

function temporarySendHeartbeatStub() {
  console.log('send heartbeat');
  return 'Exiting temporarySendHeartbeatStub';
}

/**
 * The "start" command creates the heartbeat repeater.
 *
 * @throws TODO
 */
function execute() {
  debug('Entered start.execute');
  const conf = config.getConfig();

  // TODO Replace the success/failure/progress listeners here with proper
  //      logging once we have heartbeat.
  const def = {
    name: 'Heartbeat',
    interval: conf.collectorConfig.heartbeatInterval,
    func: temporarySendHeartbeatStub, // TODO replace once we have heartbeat
    onSuccess: debug,
    onFailure: debug,
    onProgress: debug,
  };
  repeater.create(def);
  logger.info({ activity: 'cmdStart' });
  debug('Exiting start.execute');
} // execute

module.exports = {
  execute,
};
