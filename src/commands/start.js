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
const request = require('superagent');
const httpUtils = require('../utils/httpUtils');
const errors = require('../errors');
/**
 * The "start" command creates the heartbeat repeater.
 *
 * @throws TODO
 */
function execute(collectorName, refocusUrl, accessToken) {
  debug('Entered start.execute');
  configModule.initializeConfig();
  const config = configModule.getConfig();
  config.collectorConfig.collectorName = collectorName;
  config.collectorConfig.refocusUrl = refocusUrl;

  const path = `/v1/collectors/${collectorName}/start`;
  const url = refocusUrl + path;
  return request.post(url)
  .set('Authorization', accessToken)
  .then((res) => {
    config.collectorConfig.collectorToken = res.body.collectorToken;

    /*
     * TODO: Replace the success/failure/progress listeners here with proper
     * logging once we have heartbeat
     */
    repeater.create({
      name: 'Heartbeat',
      interval: config.collectorConfig.heartbeatInterval,
      func: sendHeartbeat,
      onSuccess: debug,
      onFailure: debug,
      onProgress: debug,
    });

    logger.info({ activity: 'cmdStart' });
    debug('Exiting start.execute');
  })
  .catch((err) => {
    throw new errors.RegistrationError('', `POST ${path} failed: ${err.message}`);
  });
} // execute

module.exports = {
  execute,
};
