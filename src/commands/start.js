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
require('superagent-proxy')(request);
const errors = require('../errors');
/**
 * The "start" command creates the heartbeat repeater.
 *
 * @throws TODO
 */
function execute(collectorName, refocusUrl, accessToken, rcProxy) {
  debug('Entered start.execute');
  configModule.initializeConfig();
  const config = configModule.getConfig();
  config.name = collectorName;
  config.refocus.url = refocusUrl;

  if (rcProxy.dataSourceProxy) {   // set data proxy in config
    config.dataSourceProxy = rcProxy.dataSourceProxy;
  }

  const path = `/v1/collectors/${collectorName}/start`;
  const url = refocusUrl + path;

  const req = request.post(url)
              .set('Authorization', accessToken);

  const refocusProxy = rcProxy.refocusProxy;
  if (refocusProxy) {
    config.refocus.proxy = refocusProxy; // set refocus proxy in config
    req.proxy(refocusProxy); // set proxy for following request
  }

  return req.then((res) => {
    config.refocus.collectorToken = res.body.collectorToken;

    /*
     * TODO: Replace the success/failure/progress listeners here with proper
     * logging once we have heartbeat
     */
    repeater.create({
      name: 'Heartbeat',
      interval: config.refocus.heartbeatInterval,
      func: sendHeartbeat,
      onSuccess: debug,
      onFailure: debug,
      onProgress: debug,
    });

    logger.info({ activity: 'cmdStart' });
    debug('Exiting start.execute');
  })
  .catch((err) => {
    throw new errors.CollectorStartError('', `POST ${url} failed: ${err.status} ${err.message}`);
  });
} // execute

module.exports = {
  execute,
};
