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
const nforce = require('nforce');
require('superagent-proxy')(request);
const constants = require('../constants');
const attachSubjectsToGenerator = require('../utils/httpUtils').attachSubjectsToGenerator;
const rce = require('@salesforce/refocus-collector-eval');
const AUTH_HEADER = 'headers.Authorization';

/**
 * Send Remote request to get data as per the configurations.
 *
 * @param  {Object} generator   The generator object
 * @param  {Object} simpleOauth Simple Oauth Object
 * @return {Promise<Object>} Promise that resolves to the updated generator object
 */
function sendRemoteRequest(generator) {
  return new Promise((resolve) => {
    const { context, aspects, subjects } = generator;

    const conn = generator.generatorTemplate.connection;

    // Add the url to the generator so the handler has access to it later.
    generator.preparedUrl =
      rce.prepareUrl(context, aspects, subjects, conn);
    debug('sendRemoteRequest: preparedUrl = %s', generator.preparedUrl);

    const simpleOauth = get(generator, 'connection.simple_oauth');

    // If token is present, add to request header.
    if (generator.token) {
      // Expecting accessToken or access_token from remote source.
      const accessToken = generator.token.accessToken || generator.token.access_token;
      if (get(simpleOauth, 'tokenFormat')) {
        set(conn, AUTH_HEADER,
          simpleOauth.tokenFormat.replace('{accessToken}', accessToken));
      } else if (accessToken) {
        set(conn, AUTH_HEADER, accessToken);
      }
    }

    /*
     * Add the prepared headers to the generator so the handler has access to
     * them later for validation.
     */
    generator.preparedHeaders = rce.prepareHeaders(conn.headers, context);

    // Remote request for fetching data.
    const req = request
      .get(generator.preparedUrl)
      .set(generator.preparedHeaders);

    if (conn.dataSourceProxy) req.proxy(conn.dataSourceProxy);

    req.end((err, res) => {
      if (err) {
        /*
         * If 401 (Unauthorized) error AND token is present with simple oauth
         * object, treat this token as expired and request a new one.
         */
        if (err.status === constants.httpStatus.UNAUTHORIZED && simpleOauth &&
          generator.token) {
          debug('sendRemoteRequest token expired, requesting a new one');
          generator.token = null;
          return prepareRemoteRequest(generator)
          .then((resp) => {
            if (resp) {
              debug('sendRemoteRequest returned OK');
              generator.res = resp.res;
            }

            return resolve(generator);
          });
        } else {
          debug('sendRemoteRequest returned error %O', err);
          generator.res = err;
        }

        debug('sendRemoteRequest returned error %O', err);
        generator.res = err;
      }

      if (res) {
        debug('sendRemoteRequest returned OK');
        generator.res = res;
      }

      return resolve(generator);
    });
  });
} // sendRemoteRequest

/**
 * Prepare the remote request. If connection specifies simple_oauth, use that
 * to generate a token.
 *
 * @param  {Object} generator - The generator object
 * @returns {Promise} - which resolves to a generator object with a "res"
 *  attribute carrying the response from the remote data source
 * @throws {ValidationError} if thrown by prepareUrl
 */
function prepareRemoteRequest(generator) {
  if (!generator.token && get(generator, 'connection.simple_oauth')) {
    const method = generator.connection.simple_oauth.method;
    const simpleOauth = generator.connection.simple_oauth;

    if (generator.connection.simple_oauth.salesforce) {
      const credentials = {
        clientId: simpleOauth.credentials.client.id,
        clientSecret: simpleOauth.credentials.client.secret,
        redirectUri: simpleOauth.credentials.client.redirectUri,
      };

      const org = nforce.createConnection(credentials);
      return org.authenticate(simpleOauth.tokenConfig)
        .then((token) => {
          generator.token = token;
          return sendRemoteRequest(generator);
        });

    } else {
      const oauth2 = require('simple-oauth2').create(simpleOauth.credentials);
      return oauth2[method]
      .getToken(simpleOauth.tokenConfig)
      .then((token) => {
        generator.token = token;
        return sendRemoteRequest(generator);
      });
    }
  }

  return sendRemoteRequest(generator);
} // prepareRemoteRequest

/**
 * Retrieves the list of subjects to collect data for, sets the array of
 * subjects into the generator, then prepares and executes the remote request.
 *
 * @param  {Object} generator - The generator object
 * @returns {Promise} - which resolves to a generator object with a "res"
 *  attribute carrying the response from the remote data source
 * @throws {ValidationError} if thrown by prepareUrl (from sendRemoteRequest).
 */
function collectBulk(generator) {
  debug('Entered "collectBulk" for "%s"', generator.name);
  return attachSubjectsToGenerator(generator)
  .then((g) => prepareRemoteRequest(g));
} // collectBulk

/**
 * Retrieves the list of subjects to collect data for, sets the array of
 * subjects into the generator
 *
 * @param  {Object} generator - The generator object
 * @returns {Promise} - which resolves to a generator object with subjects list
 */
function collectBySubject(generator) {
  debug('Entered "collectBySubject" for "%s"', generator.name);
  return attachSubjectsToGenerator(generator);
} // collectBySubject

module.exports = {
  collectBulk,
  collectBySubject,
  prepareRemoteRequest,
};
