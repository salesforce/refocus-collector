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
const errors = require('../config/errors');

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
  if (generator.generatorTemplate.connection.url) {
    url = urlUtils.expand(generator.generatorTemplate.connection.url,
      generator.context);
  } else if (generator.generatorTemplate.toUrl) {
    const args = {
      aspects: generator.aspects,
      ctx: generator.context,
      subject: generator.subject,
      subjects: generator.subjects,
    };
    const fbody = Array.isArray(generator.generatorTemplate.toUrl) ?
      generator.generatorTemplate.toUrl.join('\n') :
      generator.generatorTemplate.toUrl;
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
  const hkeys = Object.keys(headers);
  hkeys.forEach((key) => {
    retval[key] = urlUtils.expand(headers[key], ctx);
  });
  return retval;
} // prepareHeaders

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
  const remoteUrl = prepareUrl(generator);
  const connection = generator.generatorTemplate.connection;
  const headers =
    prepareHeaders(generator.generatorTemplate.connection.headers,
      generator.context);
  return new Promise((resolve) => {
    // for now assuming that all the calls to the remote data source is a "GET"
    request
    .get(remoteUrl)
    .set(headers)
    .end((err, res) => {
      if (err) {
        logger.error('An error was returned as a response: %o', err);
        generator.res = err;
      } else {
        debug('Remote data source returned an OK response: %o', res);
        generator.res = res;
      }

      return resolve(generator);
    });
  });
} // collect

module.exports = {
  collect,
  prepareHeaders, // export for testing
  prepareUrl, // export for testing
};
