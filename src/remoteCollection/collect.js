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
const logger = require('winston');
const evalUtils = require('../utils/evalUtils');
const urlUtils = require('./urlUtils');
const errors = require('../errors');
const configModule = require('../config/config');
const constants = require('../constants');

/**
 * Prepares url of the remote datasource either by expanding the url or by
 * calling the toUrl function specified in the generator template.
 *
 * @param {Object} generator - The generator object
 * @returns {String} - Url to the remote datasource
 * @throws {ValidationError} if generator template does not provide url or
 *  toUrl
 */
function prepareUrl(generator) {
  debug('prepareUrl', generator);
  let url;
  const toUrl = generator.generatorTemplate.connection.toUrl;
  if (generator.generatorTemplate.connection.url) {
    url = urlUtils.expand(generator.generatorTemplate.connection.url,
      generator.context);
  } else if (toUrl) {
    const args = {
      aspects: generator.aspects,
      ctx: generator.context,
      subjects: generator.subjects,
    };
    const fbody = Array.isArray(toUrl) ? toUrl.join('\n') : toUrl;
    url = evalUtils.safeToUrl(fbody, args);
  } else {
    throw new errors.ValidationError('The generator template must provide ' +
      'either a connection.url attribute or a "toUrl" attribute.');
  }

  debug('prepareUrl returning %s', url);
  return url;
} // prepareUrl

/**
 * Prepares the headers to send by expanding the connection headers specified
 * by the generator template.
 *
 * @param {Object} headers - The headers from generator template connection
 *  specification
 * @param {Object} context - The context from the generator
 * @returns {Object} - the headers object
 */
function prepareHeaders(headers, ctx) {
  debug('prepareHeaders', headers, ctx);
  const retval = {
    Accept: 'application/json', // default
  };
  if (headers && typeof headers === 'object') {
    const hkeys = Object.keys(headers);
    hkeys.forEach((key) => {
      retval[key] = urlUtils.expand(headers[key], ctx);
    });
  }

  debug('exiting prepareHeaders', retval);
  return retval;
} // prepareHeaders

/**
 * Send Remote request to get data as per the configurations.
 *
 * @param  {Object} generator   The generator object
 * @param  {Object} simpleOauth Simple Oauth Object
 * @return {Object} generator   updated generator object
 */
function sendRemoteRequest(generator, connection, simpleOauth=null) {
  return new Promise((resolve) => {
    /* Add the url to the generator so the handler has access to it later. */
    generator.url = prepareUrl(generator);

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

    let headers = prepareHeaders(connection.headers, generator.context);

    // Remote request for fetching data.
    request
    .get(generator.url)
    .set(headers)
    .end((err, res) => {
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
  prepareHeaders, // export for testing
  prepareUrl, // export for testing
};
