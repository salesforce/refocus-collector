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
const get = require('just-safe-get');
const set = require('just-safe-set');
require('superagent-proxy')(request);
const constants = require('../constants');
const findSubjects = require('../utils/httpUtils').findSubjects;
const rce = require('@salesforce/refocus-collector-eval');

/**
 * Send Remote request to get data as per the configurations.
 *
 * @param  {Object} generator   The generator object
 * @param  {Object} simpleOauth Simple Oauth Object
 * @return {Object} generator   updated generator object
 */
function sendRemoteRequest(generator, connection, simpleOauth=null) {
  return new Promise((resolve) => {
    const { context, aspects, subjects } = generator;

    // Add the url to the generator so the handler has access to it later.
    generator.preparedUrl =
      rce.prepareUrl(context, aspects, subjects, connection);
    debug('preparedUrl = %s', generator.preparedUrl);

    // If token is present, add to request header.
    if (generator.token) {
      const accessToken = generator.token.accessToken;
      if (get(simpleOauth, 'tokenFormat')) {
        set(connection, 'headers.Authorization',
          simpleOauth.tokenFormat.replace('{accessToken}', accessToken));
      } else {
        if (accessToken) set(connection, 'headers.Authorization', accessToken);
      }
    }

    /*
     * Add the prepared headers to the generator so the handler has access to
     * them later for validation.
     */
    generator.preparedHeaders =
      rce.prepareHeaders(connection.headers, context);

    // Remote request for fetching data.
    const req = request
      .get(generator.preparedUrl)
      .set(generator.preparedHeaders);

    // set proxy for following request
    if (connection.dataSourceProxy) req.proxy(connection.dataSourceProxy);

    req.end((err, res) => {
      if (err) {
        /*
         * If 401 error AND token is present with simple oauth object, treat
         * this token as expired and request a new token.
         */
        if (err.status == constants.httpStatus.UNAUTHORIZED && simpleOauth &&
          generator.token) {
          generator.token = null;
          return prepareRemoteRequest(generator);
        } else {
          debug('Remote data source returned an OK response: %o', res);
          generator.res = err;
        }
      }

      if (res) {
        debug('Remote data source returned an OK response: %O', res.body);
        generator.res = res;
      }

      return resolve(generator);
    });
  });
} // sendRemoteRequest

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
function prepareRemoteRequest(generator) {
  const connection = generator.generatorTemplate.connection;

  /*
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
} // prepareRemoteRequest

function collect(generator) {
  return findSubjects(generator.refocus.url, generator.token,
    generator.refocus.proxy, generator.subjectQuery)
  .then((subjects) => generator.subjects = subjects.body || [])
  .then(() => prepareRemoteRequest(generator));
} // onRepeat

module.exports = {
  collect,
  prepareRemoteRequest, // export for testing only
};
