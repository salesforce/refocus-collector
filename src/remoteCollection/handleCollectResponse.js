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
const errors = require('../errors');
const errorSamples = require('./errorSamples');
const logger = require('winston');
const queue = require('../utils/queue');
const httpStatus = require('../constants').httpStatus;
const commonUtils = require('../utils/commonUtils');
const RefocusCollectorEval = require('@salesforce/refocus-collector-eval');

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

  if (!cr.preparedUrl) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must have a "preparedUrl" attribute.');
  }

  // No response.
  if (!cr.res) {
    throw new errors.ValidationError(`No response from ${cr.preparedUrl}`);
  }

  // Invalid response: missing status code.
  if (!cr.res.hasOwnProperty('statusCode')) {
    throw new errors.ValidationError(`Invalid response from ${cr.preparedUrl}: `
    + 'missing HTTP status code');
  }

  // Expecting response status code to be 3 digits.
  if (!/\d\d\d/.test(cr.res.statusCode)) {
    throw new errors.ValidationError(`Invalid response from ${cr.preparedUrl}: `
    + `invalid HTTP status code "${cr.res.statusCode}"`);
  }

  try {
    // Response "Content-Type" header matches request "Accept" header?
    debug('validateCollectResponse headers', cr.preparedHeaders, cr.res.headers);
    RefocusCollectorEval.validateResponseType(cr.preparedHeaders,
      cr.res.headers);
  } catch (err) {
    throw new errors.ValidationError(err.message);
  }
} // validateCollectResponse

/**
 * Prepare arguments to be passed to the transform function.
 *
 * @param  {Object} generator - Generator object
 * @throws {TransformError} - if transform function does not return an array
 *  of zero or more samples
 * @throws {ValidationError} - if any of the above mentioned check fails
 */
function prepareTransformArgs(generator) {
  const args = {
    ctx: generator.context,
    res: generator.res,
    aspects: generator.aspects,
  };
  if (commonUtils.isBulk(generator)) {
    args.subjects = generator.subjects;
  } else {
    args.subject = generator.subjects[0]; // FIXME
  }

  return args;
} // prepareTransformArgs

/**
 * Handles the response from the remote data source by calling the transform
 * function, then enqueuing the samples from that response for bulk upsert.
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
    } catch (err) {
      debug('reject collect response due to validation error, %s',
        collectRes.preparedUrl);
      Promise.reject(err);
    }

    const tr = collectRes.generatorTemplate.transform;
    const args = prepareTransformArgs(collectRes);
    const status = collectRes.res.statusCode;

    /*
     * Figure out which transform function to use based on response status, or
     * if there is no transform designated for this HTTP status code and the
     * status is NOT one of the "OK" (2xx) statuses, generate "default" error
     * samples.
     */
    debug('RefocusCollectorEval.getTransformFunction: %O', collectRes);
    const func = RefocusCollectorEval.getTransformFunction(tr, status);
    let samplesToEnqueue = [];
    if (func) {
      samplesToEnqueue = RefocusCollectorEval.safeTransform(func, args);
      logger.info({
        generator: collectRes.name,
        url: collectRes.preparedUrl,
        numSamples: samplesToEnqueue.length,
      });
    } else {
      const errorMessage = `${collectRes.preparedUrl} returned HTTP status ` +
        `${collectRes.res.statusCode}: ${collectRes.res.statusMessage}`;
      samplesToEnqueue = errorSamples(collectRes, errorMessage);
      logger.info({
        generator: collectRes.name,
        url: collectRes.preparedUrl,
        error: errorMessage,
        numSamples: samplesToEnqueue.length,
      });
    }

    // Validate all the samples.
    samplesToEnqueue.forEach(commonUtils.validateSample);

    // Enqueue to the named queue (sample generator name).
    queue.enqueue(collectRes.name, samplesToEnqueue);
  })
  .catch((err) => {
    debug(err);
    logger.error('handleCollectResponse threw an error: ', err.name,
      err.message);
    return Promise.reject(err);
  });
} // handleCollectResponse

module.exports = {
  handleCollectResponse,
  validateCollectResponse, // export for testing only
  prepareTransformArgs, // export for testing only
};
