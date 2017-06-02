/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/heartbeat.js
 */
'use strict';
const debug = require('debug')('refocus-collector:heartbeat');
const errors = require('../errors/errors');
const request = require('superagent');
const config = require('../config/config').getConfig();

/**
 * Send a heartbeat to the Refocus server
 * @returns {Request} - the request sent to the Refocus server
 * @throws {ValidationError} - if required config fields are missing
 */
function sendHeartbeat() {
  debug('Entered sendHeartbeat');
  let collectorName;
  let baseUrl;
  let token;
  let path;
  let url;

  try {
    //collectorName = config.collectorName;
    //assume the registry only has one entry for this version
    collectorName = Object.keys(config.registry)[0];
    baseUrl = config.registry[collectorName].url;
    token = config.registry[collectorName].token;
    path = `/v1/collectors/${collectorName}/heartbeat`;
    url = baseUrl + path;

    if (baseUrl == null) {
      throw new errors.ValidationError(`No url in registry for ${collectorName}`);
    }

    if (token == null) {
      throw new errors.ValidationError(`No token in registry for ${collectorName}`);
    }

    const body = {
      logLines: [],
    };

    debug(`sendHeartbeat sending request. url: ${url} body: %o`, body);

    return request.post(url)
    .set('Authorization', token)
    .send(body);

    //don't actually send it in this version
    //.end((err, res) => {
    //  if (err) {
    //    debug('sendHeartbeat failed');
    //    throw err;
    //  }
    //debug('sendHeartbeat successful');
    //});
  }
  catch (err) {
    if (config == null || config.registry == null) {
      throw new errors.ValidationError('Registry config is missing');
    } else if (config.registry[collectorName] == null) {
      throw new errors.ValidationError(`Registry entry empty for ${collectorName}`);
    } else {
      throw err;
    }
  }

}

module.exports = {
  sendHeartbeat,
  config,  // export for testing
};
