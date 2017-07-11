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
 * calling the toUrl function specified in the generator template
 * @param  {Object} generator - The generator object
 * @returns {String} - Url to the remote datasource
 */
function prepareUrl(generator) {
  debug('prepareUrl', generator);
  if (generator.generatorTemplate.connection.url) {
    return urlUtils.expand(generator.generatorTemplate.connection.url,
      generator.context);
  }

  const functionArgs = {
    aspects: generator.aspects,
    ctx: generator.ctx,
    subject: generator.subject,
    subjects: generator.subjects,
  };
  const fbody = Array.isArray(generator.generatorTemplate.toUrl) ?
    generator.generatorTemplate.toUrl.join('\n') :
    generator.generatorTemplate.toUrl;
  return evalUtils.safeToUrl(fbody, functionArgs);
} // prepareUrl

/**
 *  Uses the superagent library to make the request to the remote datasource
 *  and resolves the response.
 * @param  {String} remoteUrl - Url of the remote data source
 * @param  {String} generator  - The generator object
 * @returns {Promise} - which resolves to a generator object with a "res"
 * attribute carrying the response from the remote data source
 */
function doCollection(remoteUrl, generator) {
  const connection = generator.generatorTemplate.connection;
  const headers = {};
  if (connection.headers && connection.headers.Authorization) {
    headers.Authorization = connection.headers.Authorization;
  }

  return new Promise((resolve) => {
    // for now assuming that all the calls to the remote data source is a "GET"
    request
    .get(remoteUrl)
    .set(headers)
    .set('Accept', 'application/json')
    .end((err, res) => {
      if (err) {
        logger.log('error', 'An error was returned as a response: %o', err);
        generator.res = err;
      } else {
        debug('Remote data source returned an OK response: %o', res);
        generator.res = res;
      }

      return resolve(generator);
    });
  });
} // doCollection

/**
 * This is responsible for the data collection from the remote datasource. It
 * calls the "prepareUrl" function to prepare the remote url and then calls the
 * "doCollection" function to get the data.
 * @param  {Object} generator - The generator object
 * @returns {Promise} - which resolves to a generator object with a "res"
 * attribute carrying the response from the remote data source
 */
function collect(generator) {
  const remoteUrl = prepareUrl(generator);
  return doCollection(remoteUrl, generator);
} // collect

module.exports = {
  collect,
};
