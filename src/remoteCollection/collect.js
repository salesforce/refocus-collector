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
const attachSubjectsToGenerator = require('../utils/httpUtils')
  .attachSubjectsToGenerator;
const rce = require('@salesforce/refocus-collector-eval');
const AUTH_HEADER = 'headers.Authorization';
const configModule = require('../config/config');
const errors = require('../errors');

const DEFAULT_TIMEOUT_RESPONSE_MILLIS = 10000; // TODO move to Refocus config
const DEFAULT_TIMEOUT_DEADLINE_MILLIS = 30000; // TODO move to Refocus config
const MAX_RETRIES = 3; // TODO move to Refocus config

/**
 * Helper function returns true if err is Unauthorized AND token is present
 * with simple oauth object. In this situation, we will treat this token as
 * expired and request a new one.
 *
 * @param {Error} err - the error
 * @param {Object} simpleOauth - the simpleOauth configuration from the
 *  connection
 * @param {String} token - the token
 * @returns {Boolean} true if err is Unauthorized AND token is present with
 *  simple oauth object
 */
function shouldRequestNewToken(err, simpleOauth, token) {
  return err.status === constants.httpStatus.UNAUTHORIZED && simpleOauth &&
    token;
} // shouldRequestNewToken

/**
 * Helper fn returning
 * configModule.getConfig().refocus.requireSslToRemoteDataSource value
 *
 * @returns {boolean}
 */
function requiresSSLOnly() {
  return configModule.getConfig().refocus.requireSslToRemoteDataSource;
}

/**
 * Helper function to set up the superagent request to connect to the remote
 * data source. Configures request timeout, retries and proxy.
 *
 * @param {Object} gen - the sample generator
 * @param {Object} conn - the connection from the sample generator template
 * @returns {Request} - the superagent request
 */
function generateRequest(gen, conn) {
  // ref. https://visionmedia.github.io/superagent/#timeouts
  const genTimeout = {
    response: get(gen, 'timeout.response') || DEFAULT_TIMEOUT_RESPONSE_MILLIS,
    deadline: get(gen, 'timeout.deadline') || DEFAULT_TIMEOUT_DEADLINE_MILLIS,
  };
  const req = request
    .get(gen.preparedUrl)
    .set(gen.preparedHeaders)
    .timeout(genTimeout)
    .retry(MAX_RETRIES);

  if (conn.dataSourceProxy) {
    req.proxy(conn.dataSourceProxy);
  }

  return req;
} // generateRequest

/**
 * Send request to remote data source specified by the sample generator.
 * Automatically retries requests if they fail in a way that is transient or
 * could be due to a flaky internet connection.
 *
 * @param  {Object} generator - the generator object
 * @returns {Promise<Object>} the updated generator object
 */
function sendRemoteRequest(generator) {
  const { context, aspects, subjects } = generator;
  const conn = generator.generatorTemplate.connection;
  generator.connection = rce.expandObject(generator.connection, context);

  // Add the url to the generator so the handler has access to it later.
  generator.preparedUrl = rce.prepareUrl(context, aspects, subjects, conn);
  debug('sendRemoteRequest: preparedUrl = %s', generator.preparedUrl);

  if (requiresSSLOnly() && !generator.preparedUrl.includes('https')) {
    const msg = 'Your Refocus instance is configured to require SSL for ' +
      'connections to remote data sources. Please update Sample Generator ' +
      '"' + generator.name + '" to specify an https connection url.';
    generator.res = new errors.ValidationError(msg);
    return Promise.resolve(generator);
  }

  const simpleOauth = get(generator, 'connection.simple_oauth');

  // If token is present, add to request header.
  if (generator.token) {
    // Expecting accessToken or access_token from remote source.
    const accessToken = generator.token.accessToken ||
      generator.token.access_token;
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

  const req = generateRequest(generator, conn);

  return new Promise((resolve) => {
    req.end((err, res) => {
      if (err) {
        if (shouldRequestNewToken(err, simpleOauth, generator.token)) {
          debug('sendRemoteRequest token expired, requesting a new one');
          generator.token = null;

          // eslint-disable-next-line no-use-before-define
          return prepareRemoteRequest(generator)
            .then((resp) => {
              if (resp) {
                debug('sendRemoteRequest returned OK');
                generator.res = resp.res;
              }

              return resolve(generator);
            });
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

    // special case for simple_oauth.salesforce
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
    }

    // otherwise when it's NOT simple_oauth.salesforce...
    // eslint-disable-next-line global-require
    const oauth2 = require('simple-oauth2').create(simpleOauth.credentials);
    return oauth2[method]
      .getToken(simpleOauth.tokenConfig)
      .then((token) => {
        generator.token = token;
        return sendRemoteRequest(generator);
      });
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
