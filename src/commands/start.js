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
const flush = require('../sampleQueue/sampleQueueOps').flush;
const sendHeartbeat = require('../heartbeat/heartbeat').sendHeartbeat;
const fs = require('fs');
const registryFile = require('../constants').registryLocation;

/**
 * Get registry object from registry file.
 *
 * @param {String} name - Name of the collector
 * @param {String} file - path of registry file
 *
 * @returns {Object} regObj - Return registry object
 */
function getRegistryObj(name, file) {
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    if (name in registryData) {
      return registryData[name];
    } else {
      return new Error('There is no registry with name');
    }
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

/**
 * The "start" command creates the heartbeat repeater.
 *
 * @throws TODO
 */
function execute(name) {
  debug('Entered start.execute');
  configModule.setRegistry();
  const config = configModule.getConfig();
  const regObj = getRegistryObj(name, registryFile);

  repeater.create({
    name: 'Heartbeat',
    interval: config.collectorConfig.heartbeatInterval,
    func: () => sendHeartbeat(regObj), // TODO replace once we have heartbeat
    onSuccess: debug,
    onFailure: debug,
    onProgress: debug,
  });

  // flush function does not return anything, hence no event functions
  repeater.create({
    name: 'SampleQueueFlush',
    interval: config.collectorConfig.sampleUpsertQueueTime,
    func: () => flush(config.collectorConfig.maxSamplesPerBulkRequest,
      regObj),
  });
  logger.info({ activity: 'cmdStart' });
  debug('Exiting start.execute');
} // execute

module.exports = {
  execute,
};
