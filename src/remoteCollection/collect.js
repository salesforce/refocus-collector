/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/remoteCollection/collect.js
 */

const debug = require('debug')('refocus-collector:remoteCollection');
const request = require('superagent');
require('superagent-proxy')(request);
const constants = require('../constants');
const rce = require('@salesforce/refocus-collector-eval');
const configModule = require('../config/config');

/**
 * Send Remote request to get data as per the configurations.
 *
 * @param  {Object} generator   The generator object
 * @param  {Object} simpleOauth Simple Oauth Object
 * @return {Object} generator   updated generator object
 */
function sendRemoteRequest(generator, connection, simpleOauth=null) {
  return new Promise((resolve) => {
    const { ctx, aspects, subjects } = generator;

    // Add the url to the generator so the handler has access to it later.
    generator.preparedUrl = rce.prepareUrl(ctx, aspects, subjects, connection);

    // If token is present then add token to request header.
    if (generator.token) {
      const accessToken = generator.token.accessToken;
      if (simpleOauth.tokenFormat) {
        connection.headers.Authorization
        = simpleOauth.tokenFormat.replace('{accessToken}', accessToken);
      } else {
        connection.headers.Authorization = accessToken;
      }
    }

    const preparedHeaders = rce.prepareHeaders(connection.headers, ctx);

    // Remote request for fetching data.
    const req = request
                .get(generator.preparedUrl)
                .set(preparedHeaders);

    const config = configModule.getConfig();
    if (config.dataSourceProxy) {
      req.proxy(config.dataSourceProxy); // set proxy for following request
    }

    req.end((err, res) => {
      if (err) {
        /*
         * If error is 401 and token is present with simple oauth object
         * then token is expired and request new token again.
         */
        if (err.status == constants.httpStatus.UNAUTHORIZED
          && simpleOauth && generator.token) {
          generator.token = null;
          collect(generator);
        } else {
          debug('Remote data source returned an OK response: %o', res);
          generator.res = err;
        }
      }

      if (res) {
        debug('Remote data source returned an OK response: %o', res);
        generator.res = res;
      }

      return resolve(generator);
    });
  });
}

/**
 * This is responsible for the data collection from the remote data source. It
 * calls the "prepareUrl" function to prepare the remote url and then uses the
 * superagent library to make the request to the remote data source and
 * resolves the response.
 * If the generator template does not specify an "Accept" header, default to
 * "application/json".
 *
 * @param  {Object} generator - The generator object
 * @returns {Promise} - which resolves to a generator object with a "res"
 *  attribute carrying the response from the remote data source
 * @throws {ValidationError} if thrown by prepareUrl
 */
function collect(generator) {
  const connection = generator.generatorTemplate.connection;

  /**
   * If simple_oauth object is present then use that for token generation
   * and using that token remote request should be done.
   */
  if (connection.simple_oauth) {
    const method = connection.simple_oauth;
    const simpleOauth = generator.simple_oauth;

    if (!generator.token) {
      const oauth2 = require('simple-oauth2').create(simpleOauth.credentials);
      return oauth2[method]
      .getToken(simpleOauth.tokenConfig)
      .then((token) => {
        generator.token = token;
        return sendRemoteRequest(generator, connection, simpleOauth);
      });
    }

    return sendRemoteRequest(generator, connection, simpleOauth);
  } else {
    return sendRemoteRequest(generator, connection);
  }
} // collect

module.exports = {
  collect,
};
