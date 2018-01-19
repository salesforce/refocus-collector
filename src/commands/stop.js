/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/stop.js
 *
 * Command execution for the "stop" command.
 */
const debug = require('debug')('refocus-collector:commands');
const configModule = require('../config/config');
const repeater = require('../repeater/repeater');
const queueUtils = require('../utils/queueUtils');
const request = require('superagent');
require('superagent-proxy')(request);
const errors = require('../errors');

/**
 * Sends a POST request to change the status of the collector in the refocus
 * server to 'Stopped'.
 * @returns {Object} - Response of the stop collector endpoint
 */
function sendStopRequest() {
  debug('Entered stop.sendStopRequest');
  const config = configModule.getConfig();
  if (!config) {
    throw new errors.CollectorStopError('Collector Config is not set. ' +
      'Run the start command to set the config');
  }

  const collectorName = config.name;
  const refocusUrl = config.refocus.url;
  const accessToken = config.refocus.accessToken;
  const proxy = config.refocus.proxy;
  const collectorStopEndpoint = `/v1/${collectorName}/stop`;
  const urlToPost = refocusUrl + collectorStopEndpoint;
  const req = request.post(urlToPost)
    .send({ name: collectorName })
    .set('Authorization', accessToken);
  if (proxy) {
    req.proxy(proxy); // set proxy for following request
  }

  return req.then((res) => {
    debug('stop collector response body', res.body);
    return res;
  })
  .catch((err) => {
    throw new errors.CollectorStopError('', `POST ${urlToPost} failed: ` +
      `${err.status} ${err.message}`);
  });
}

/**
 * Calling execute does the following
 * . Stops all the generator repeat
 * . Flushes the buffered queue for each of the generator if force termination
 *    is not requested
 * . Sends a POST request to change the status of the collector to stop in the
 *   refocus server.
 * @param {Boolean} forceTerminate - Set to true if we need to flush
 *  @returns {Object} Response of the stop collector endpoint.
 */
function execute(forceTerminate) {
  debug('Entered stop.execute');
  repeater.stopAllRepeat();

  // do not flush when force termination is requested
  if (!forceTerminate) {
    queueUtils.flushAllBufferedQueues();
  }

  return sendStopRequest();
  debug('Exited stop.execute');
  process.exit();
} // execute

module.exports = {
  execute,
};
