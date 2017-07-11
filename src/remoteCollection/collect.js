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

/**
 * Prepares url of the remote datasource either by expanding the url or by
 * calling the toUrl function specified in the generator template.
 *
 * @param  {Object} generator - The generator object
 * @returns {String} - Url to the remote datasource
 */
function prepareUrl(generator) {
  debug('prepareUrl', generator);
  let url;
  if (generator.generatorTemplate.connection.url) {
    url = urlUtils.expand(generator.generatorTemplate.connection.url,
      generator.context);
  } else {
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
  }

  debug('prepareUrl returning %s', url);
  return url;
} // prepareUrl

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
 * attribute carrying the response from the remote data source
 */
function collect(generator) {
  const remoteUrl = prepareUrl(generator);
  const connection = generator.generatorTemplate.connection;
  const headers = {
    Accept: 'application/json', // default
  };
  if (connection.headers) {
    if (connection.headers.Authorization) {
      headers.Authorization = connection.headers.Authorization;
    }

    if (connection.headers.Accept) {
      headers.Accept = connection.headers.Accept;
    }
  }

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
  prepareUrl, // export for testing
};
