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

  if (!cr.res) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must have a "res" attribute.');
  }

  if (!cr.name) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must have a "name" attribute.');
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
      const tr = collectRes.generatorTemplate.transform;
      const t = Array.isArray(tr) ? tr.join('\n') : tr;
      const transformedSamples = evalUtils.safeTransform(t, collectRes);
      logger.info(`{
        generator: ${collectRes.name},
        numSamples: ${transformedSamples.length},
      }`);
      enqueue(transformedSamples);
    } catch (err) {
      debug(err);
      logger.error('handleCollectResponse threw an error: ', err.name,
        err.message);
      return Promise.reject(err);
    }
  }).catch((err) => {
    debug(err);
    logger.error('handleCollectResponse threw an error: ', err.name,
      err.message);
    return Promise.reject(err);
  });
} // handleCollectResponse

module.exports = {
  handleCollectResponse,
  validateCollectResponse, // export for testing only
};
