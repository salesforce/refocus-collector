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
const errors = require('../errors/errors');
const logger = require('winston');
const enqueue = require('../sampleQueue/sampleQueueOps').enqueue;

/**
 * Handles the response from the remote data source by calling the transform
 * function. It also calls the sample bulk upsert api to send the data to the
 * configured refocus instance immediately. In the later versions,
 * instead of calling the sample bulk upsert API immediately, we can start
 * storing the sample in an in-memory sample queue.
 * @param  {Promise} collectResponse - Response from the "collect" function.
 * This resolves to the generator object along with the "res" attribute
 * which maps to the response from the remote data source
 * @returns {Promise} - which can be resolved to the response of the sample
 * bulk upsert API. An error object is returned if an error is thrown.
 * @throws {ArgsError} If the argument "collectRes" is not an object.
 * @throws {ValidationError} If the argument "collectRes" does not have a "res"
 *  or "ctx" or "subject|subjects" and "transform" attribute.
 */
function handleCollectResponse(collectResponse) {
  debug('Entered handleCollectResponse: >>');
  return collectResponse.then((collectRes) => {
    try {
      if (!collectRes || typeof collectRes !== 'object' ||
        Array.isArray(collectRes)) {
        throw new errors.ArgsError('The argument to handleCollectResponse ' +
          'cannot be null or an Array');
      }

      if (!collectRes.res) {
        throw new errors.ValidationError('The object passed to ' +
          'handleCollectResponse should have a res attribute');
      }

      const transformedSamples =
        evalUtils.safeTransform(collectRes.generatorTemplate.transform,
          collectRes);

      // collectRes (which is sample generator) should have a name.
      if (!collectRes.name) {
        throw new errors.ValidationError('The object passed to ' +
          'handleCollectResponse should have a "name" attribute');
      }

      logger.info(`{
        generator: ${collectRes.name},
        numSamples: ${transformedSamples.length},
      }`);

      enqueue(transformedSamples);
    } catch (err) {
      logger.error('handleCollectResponse threw an error: ',
        err.name, err.message);
      return Promise.reject(err);
    }
  }).catch((err) => {
    logger.error('handleCollectResponse threw an error: ',
        err.name, err.message);
    return Promise.reject(err);
  });
} // handleCollectResponse

module.exports = {
  handleCollectResponse,
};
