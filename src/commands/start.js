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
'use strict'; // eslint-disable-line strict
const debug = require('debug')('refocus-collector:commands');
const logger = require('winston');
const configModule = require('../config/config');
const sanitize = require('../utils/commonUtils').sanitize;
const repeater = require('../repeater/repeater');
const heartbeatRepeatName = require('../constants').heartbeatRepeatName;
const sendHeartbeat = require('../heartbeat/heartbeat').sendHeartbeat;
const doPost = require('../utils/httpUtils.js').doPostToRefocus;
const errors = require('../errors');
const COLLECTOR_START_PATH = '/v1/collectors/start';

/**
 * The "start" command creates the heartbeat repeater.
 * @returns {Promise} - which resolves to the response of the start endpoint
 * @throws CollectorStartError
 */
function execute() {
  debug('Entered start.execute');
  const config = configModule.getConfig();
  const url = config.refocus.url + COLLECTOR_START_PATH;
  const body = { name: config.name, version: config.metadata.version };

  return doPost(COLLECTOR_START_PATH, body)
  .then((res) => {
    const sanitized = sanitize(res.body, ['token']);

    debug('start execute response body', sanitized);
    config.refocus.collectorToken = res.body.token;

    /*
     * freeze the attributes of config.refocus added by the start command
     * to avoid any accidentals edits/deletes to it.
     */
    Object.keys(config.refocus).forEach(Object.freeze);

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
    return res;
  })
  .catch((err) => {
    throw new errors.CollectorStartError('', `POST ${url} failed: ${err.status} ${err.message}`);
  });
} // execute

module.exports = {
  execute,
};
