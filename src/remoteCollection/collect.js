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
const Promise = require('bluebird');
require('superagent-proxy')(request);
const constants = require('../constants');
const { getSubjectsForGenerator } = require('../utils/httpUtils');
const rce = require('@salesforce/refocus-collector-eval');
const AUTH_HEADER = 'headers.Authorization';
const configModule = require('../config/config');
const errors = require('../errors');
const sanitize = require('../utils/commonUtils').sanitize;

/**
 * Helper function returns true if err is Unauthorized AND token is present
 * with simple oauth object. In this situation, we will treat this token as
 * expired and request a new one.
 *
 * @param {Error} err - the error
 * @param {Object} generator - the generator object
 * @returns {Boolean} true if err is Unauthorized AND token is present with
 *  simple oauth object
 */
function shouldRequestNewToken(err, generator) {
  const unauthorized = err.status === constants.httpStatus.UNAUTHORIZED;
  const simpleOauth = get(generator, 'connection.simple_oauth');
  const token = generator.OAuthToken;
  return unauthorized && simpleOauth && token;
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
 * Helper function to set up the super-agent request to connect to the remote
 * data source. Configures request timeout, retries and proxy.
 *
 * @param {Object} generator - the sample generator
 * @param {Object} requestData - data specific to this request
 * @returns {Request} - the superagent request
 */
function generateRequest(generator, requestData) {
  const refConf = configModule.getConfig().refocus;

  // ref. https://visionmedia.github.io/superagent/#timeouts
  const conn = generator.generatorTemplate.connection;
  const genTimeout = {
    response:
      get(generator, 'timeout.response') || refConf.timeoutResponseMillis ||
      constants.connection.timeout.response,
    deadline:
      get(generator, 'timeout.deadline') || refConf.timeoutDeadlineMillis ||
      constants.connection.timeout.deadline,
  };

  const req = request
    .get(requestData.preparedUrl)
    .set(requestData.preparedHeaders)
    .timeout(genTimeout)
    .retry(refConf.maxRetries || constants.connection.maxRetries);

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
 * @param {Object} generator - the generator object
 * @param {Object} requestData - data specific to this request
 * @returns {Promise} - resolves to the requestData object
 */
function sendRemoteRequest(generator, requestData) {
  debug('Entered "sendRemoteRequest" for "%s"', generator.name);

  if (requiresSSLOnly() && !requestData.preparedUrl.includes('https')) {
    const msg = 'Your Refocus instance is configured to require SSL for ' +
      'connections to remote data sources. Please update Sample Generator ' +
      '"' + generator.name + '" to specify an https connection url.';
    requestData.res = new errors.ValidationError(msg);
    return Promise.resolve(requestData);
  }

  /*
   * Don't bother sending request if prepareRemoteRequest already set error as
   * generator.res.
   */
  if (requestData.res instanceof Error) {
    return Promise.resolve(requestData);
  }

  const req = generateRequest(generator, requestData);

  return new Promise((resolve, reject) => {
    req.end((err, _res) => {
      if (err) {
        if (shouldRequestNewToken(err, generator)) {
          debug('sendRemoteRequest token expired, requesting a new one');
          generator.OAuthToken = null;
          reject(Error('OAuth token expired'));
        } // shouldRequestNewToken

        debug('sendRemoteRequest returned error %O', err);
        if (get(generator, 'connection.simple_oauth')) {
          const method = generator.connection.simple_oauth.method;
          requestData.res =
            new Error(`simple-oauth2 (method=${method}): ${err.message}`);
        } else {
          requestData.res = err;
        }
      } else if (_res) {
        debug('sendRemoteRequest returned OK');
        requestData.res = _res;
      }

      return resolve(requestData);
    });
  });
} // sendRemoteRequest

/**
 * Prepare and attach the token, connection, url, and headers to the generator
 * object.
 *
 * @param {Object} generator - The generator object
 * @param {Array} subjects - The subjects to collect data for
 * @returns {Object} - requestData object with attributes:
 *  subjects, preparedUrl, preparedHeaders, res
 * @throws {ValidationError} if thrown by prepareUrl
 */
function prepareRemoteRequest(generator, subjects) {
  debug('Entered "prepareRemoteRequest" for "%s"', generator.name);
  const { context, aspects } = generator;
  const requestData = { subjects };

  // Prepare auth
  const conn = generator.generatorTemplate.connection;
  if (generator.OAuthToken) {
    // Expecting accessToken or access_token from remote source.
    const accessToken = generator.OAuthToken.accessToken ||
      generator.OAuthToken.access_token;
    const simpleOauth = get(generator, 'connection.simple_oauth');
    if (get(simpleOauth, 'tokenFormat')) {
      set(conn, AUTH_HEADER,
        simpleOauth.tokenFormat.replace('{accessToken}', accessToken));
    } else if (accessToken) {
      set(conn, AUTH_HEADER, accessToken);
    }
  }

  // Prepare headers
  requestData.preparedHeaders = rce.prepareHeaders(conn.headers, context);

  // Prepare url
  requestData.preparedUrl = rce.prepareUrl(context, aspects, subjects, conn);

  debug('prepareRemoteRequest: preparedGenerator: %O', sanitize({
    preparedUrl: requestData.preparedUrl,
    preparedHeaders: requestData.preparedHeaders,
    OAuthToken: generator.OAuthToken,
    connection: generator.connection,
  }, ['OAuthToken', 'Authorization', 'simple_oauth']));
  return requestData;
} // prepareRemoteRequest

/**
 * Get new OAuth token if necessary, and attach to generator
 *
 * @param {Object} generator - The generator object
 * @returns {Promise} - resolves to nothing on success, error on failure
 */
function attachOAuthToken(generator) {
  const { context, connection } = generator;

  return Promise.resolve()
  .then(() => {
    if (!generator.OAuthToken && get(generator, 'connection.simple_oauth')) {
      if (generator.connection) {
        generator.connection = rce.expandObject(connection, context);
      }

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
        return org.authenticate(simpleOauth.tokenConfig);
      }

      // otherwise when it's NOT simple_oauth.salesforce...
      // eslint-disable-next-line global-require
      const oauth2 = require('simple-oauth2').create(simpleOauth.credentials);
      return oauth2[method].getToken(simpleOauth.tokenConfig);
    }
  })
  .then((token) => {
    if (token) {
      generator.OAuthToken = token;
    }
  })

  // return errors instead of rejecting so we can create error samples
  .catch(err => err);
} // attachOAuthToken

/**
 * Handle an error when attempting to get the OAuth token. Return a requestData object
 * with the relevant information so it will get logged as an error sample.
 *
 * @param {Error} err - The error that occurred when attempting to get the OAuth token
 * @param {Object} generator - The generator object
 * @param {Array} subjects - Resolved subjects from this generators subjectQuery
 * @returns {Object} - a requestData object with attributes:
 *  subjects, preparedUrl, res
 */
function handleOAuthError(err, generator, subjects) {
  const { method, credentials } = generator.connection.simple_oauth;
  const { tokenHost, tokenPath } = credentials.auth;
  err.message = `Error getting OAuth token (method=${method}): ${err.message}`;
  return {
    subjects,
    preparedUrl: `${tokenHost}${tokenPath}`,
    res: err,
  };
} // handleOAuthError

/**
 * Handle an error during collection. If it was caused by an expired token, get new token
 * and retry. Otherwise, return the error to create error samples.
 *
 * @param {Error} err - The error that occurred when attempting to get the OAuth token
 * @param {Object} generator - The generator object
 * @param {Boolean} bulk - bulk arg from collect function
 * @returns {Object} - a requestData object with attributes:
 *  subjects, preparedUrl, res
 */
function handleCollectError(err, generator, bulk) {
  if (err.message === 'OAuth token expired') {
    return collect(bulk, generator);
  } else {
    throw err;
  }
}

/**
 * Collect data. Prepare, then send the remote request.
 *
 * @param {Object} generator - The generator object
 * @param {Array} subjects - The subjects to collect data for
 * @returns {Promise} - resolves to a requestData object with attributes:
 *  subjects, preparedUrl, preparedHeaders, res
 * @throws {ValidationError} if thrown by prepareUrl (from sendRemoteRequest).
 */
function doCollectBulk(generator, subjects) {
  const requestData = prepareRemoteRequest(generator, subjects);
  return sendRemoteRequest(generator, requestData);
} // doCollectBulk

/**
 * Collect data. Prepare, then send the remote request.
 *
 * @param {Object} generator - The generator object
 * @param {Array} subjects - The subjects to collect data for
 * @returns {Promise} - resolves to a requestData object with attributes:
 *  subjects, preparedUrl, preparedHeaders, res
 * @throws {ValidationError} if thrown by prepareUrl (from sendRemoteRequest).
 */
function doCollectBySubject(generator, subjects) {
  return Promise.map(subjects, (subject) =>
    doCollectBulk(generator, [subject])
  );
} // doCollectBySubject

/**
 * Retrieves the list of subjects to collect data for, sets the array of
 * subjects into the generator, then prepares and executes the remote request.
 *
 * @param {Boolean} bulk - If true, send a single request. If false, send
 * separate requests for each subject.
 * @param {Object} generator - The generator object
 * @returns {Promise} - resolves to an array of requestData objects with attributes:
 *  subjects, preparedUrl, preparedHeaders, res
 */
function collect(bulk, generator) {
  return Promise.join(
           attachOAuthToken(generator),
           getSubjectsForGenerator(generator),
         )
         .then(([err, subjects]) =>
           err ? handleOAuthError(err, generator, subjects)
               : bulk ? doCollectBulk(generator, subjects)
                      : doCollectBySubject(generator, subjects)
         )
         .catch((err) =>
           handleCollectError(err, generator, bulk)
         );
} // collect

module.exports = {
  collectBulk: collect.bind(null, true),
  collectBySubject: collect.bind(null, false),
};
