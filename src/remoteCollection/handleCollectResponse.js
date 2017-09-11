/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/remoteCollection/handleCollectResponse.js
 */
const debug = require('debug')('refocus-collector:handleCollectResponse');
const evalUtils = require('../utils/evalUtils');
const errors = require('../errors');
const errorSamples = require('./errorSamples');
const logger = require('winston');
const enqueue = require('../sampleQueue/sampleQueueOps').enqueue;

/**
 * Validates the response from the collect function. Confirms that it is an
 * object and has "res" and "name" attributes.
 *
 * @param  {Object} collectResponse - Response from the "collect" function,
 *  i.e. the generator object along with the "res" attribute which maps to the
 *  response from the remote data source.
 * @throws {ValidationError} If the argument is not an object or is missing
 *  "res" or "name" attributes.
 */
function validateCollectResponse(cr) {
  if (!cr || typeof cr !== 'object' || Array.isArray(cr)) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must be an object, must not be ' +
      'null, and must not be an Array.');
  }

  if (!cr.name) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must have a "name" attribute.');
  }

  if (!cr.url) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must have a "url" attribute.');
  }

  // No response.
  if (!cr.res) {
    throw new Error(`No response from ${cr.url}`);
  }

  // Invalid response: missing status code.
  if (!cr.res.hasOwnProperty('statusCode')) {
    throw new Error(`Invalid response from ${cr.url}: missing HTTP status ` +
      'code');
  }

  // Expecting response status code to be 3 digits.
  if (!/\d\d\d/.test(cr.res.statusCode)) {
    throw new Error(`Invalid response from ${cr.url}: invalid HTTP status ` +
      `code "${cr.res.statusCode}"`);
  }
} // validateCollectResponse

/**
 * Handles the response from the remote data source by calling the transform
 * function. It also calls the sample bulk upsert api to send the data to the
 * configured refocus instance immediately. In the later versions,
 * instead of calling the sample bulk upsert API immediately, we can start
 * storing the sample in an in-memory sample queue.
 *
 * @param  {Promise} collectResponse - Response from the "collect" function.
 *  This resolves to the generator object along with the "res" attribute which
 *  maps to the response from the remote data source
 * @returns {Promise} - which resolves to the response of the sample bulk
 *  upsert API or an error.
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function handleCollectResponse(collectResponse) {
  debug('Entered handleCollectResponse');
  return collectResponse.then((collectRes) => {
    try {
      validateCollectResponse(collectRes);

      /*
       * If the transform is a string, then we use that function for all
       * status codes.
       */
      const tr = collectRes.generatorTemplate.transform;
      if (typeof tr === 'string') { // match all status codes
        const samplesToEnqueue = evalUtils.safeTransform(tr, collectRes);
        logger.info({
          generator: collectRes.name,
          url: collectRes.url,
          numSamples: samplesToEnqueue.length,
        });
        return enqueue(samplesToEnqueue);
      }

      /*
       * The transform is *not* a string, so check for a status code regex
       * match which maps to a transform for error samples. Use the first one
       * to match.
       */
      Object.keys(tr).forEach((statusMatcher) => {
        const re = new RegExp(statusMatcher);
        if (re.test(res.statusCode)) {
          const t = tr[statusMatcher];
          const samplesToEnqueue = evalUtils.safeTransform(t, collectRes);
          logger.info({
            generator: collectRes.name,
            url: collectRes.url,
            numSamples: samplesToEnqueue.length,
          });
          return enqueue(samplesToEnqueue);
        }
      });

      /*
       * If there is no transform designated for this HTTP status code, just
       * generate default error samples.
       */
      throw new Error(`${collectRes.url} returned HTTP status ` +
        `${res.statusCode}: ${res.statusMessage}`);
    } catch (err) {
      if (err instanceof errors.ValidationError) {
        debug(err);
        logger.error('handleCollectResponse threw an error: ', err.name,
          err.message);
        return Promise.reject(err);
      } else {
        const samplesToEnqueue = errorSamples(cr, err.message);
        logger.info({
          generator: collectRes.name,
          url: collectRes.url,
          error: err.message,
          numSamples: samplesToEnqueue.length,
        });
        return enqueue(samplesToEnqueue);
      }
    }
  })
  .catch((err) => {
    debug(err);
    logger.error('handleCollectResponse threw an error: ', err.name,
      err.message);
    return Promise.reject(err);
  });
} // handleCollectResponse

module.exports = {
  generateErrorSamples, // export for testing only
  handleCollectResponse,
  validateCollectResponse, // export for testing only
};
