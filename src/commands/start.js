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
const heartbeatRepeatName = require('../constants').heartbeatRepeatName;
const sendHeartbeat = require('../heartbeat/heartbeat').sendHeartbeat;
const request = require('superagent');
require('superagent-proxy')(request);
const errors = require('../errors');
const COLLECTOR_START_PATH = '/v1/collectors/start';
const package = require('../../package.json');

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
  config.refocus.accessToken = accessToken;
  if (rcProxy.dataSourceProxy) { // set data proxy in config
    config.dataSourceProxy = rcProxy.dataSourceProxy;
  }

  const url = refocusUrl + COLLECTOR_START_PATH;
  const req = request.post(url)
    .send({ name: collectorName, version: package.version })
    .set('Authorization', accessToken);
  const refocusProxy = rcProxy.refocusProxy;
  if (refocusProxy) {
    config.refocus.proxy = refocusProxy; // set refocus proxy in config
    req.proxy(refocusProxy); // set proxy for following request
  }

  return req.then((res) => {
    debug('start execute response body', res.body);
    config.refocus.collectorToken = res.body.token;

    /*
     * TODO: Replace the success/failure/progress listeners here with proper
     * logging once we have heartbeat
     */
    repeater.create({
      name: heartbeatRepeatName,
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
