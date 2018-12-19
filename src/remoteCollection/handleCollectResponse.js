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
const Promise = require('bluebird');
const commonUtils = require('../utils/commonUtils');
const RefocusCollectorEval = require('@salesforce/refocus-collector-eval');
const httpUtils = require('../utils/httpUtils');
const configModule = require('../config/config');

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
function validateCollectResponse(cr, resSchema) {
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

  // It's already an error!
  if (cr.res instanceof Error) {
    if (cr.res.hasOwnProperty('retries')) {
      cr.res.message += ` (${cr.res.retries} retries)`;
    }

    throw cr.res;
  }

  // Invalid response: missing status code.
  if (!cr.res.hasOwnProperty('statusCode')) {
    logger.error(`Invalid response from ${cr.preparedUrl}: ` +
      'missing HTTP status code', cr.res);
    throw new errors.ValidationError('Invalid response from ' +
      `${cr.preparedUrl}: missing HTTP status code`);
  }

  // Expecting response status code to be 3 digits.
  if (!(/\d\d\d/).test(cr.res.statusCode)) {
    logger.error(`Invalid response from ${cr.preparedUrl}: ` +
      `invalid HTTP status code "${cr.res.statusCode}"`, cr.res);
    throw new errors.ValidationError('Invalid response from ' +
      `${cr.preparedUrl}: invalid HTTP status code "${cr.res.statusCode}"`);
  }

  // Response "Content-Type" header matches request "Accept" header?
  RefocusCollectorEval.validateResponseType(cr.preparedHeaders, cr.res.headers);

  // Response matches schema?
  if (resSchema) {
    RefocusCollectorEval.validateResponseBody(cr.res, resSchema);
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
    args.subject = generator.subjects[0]; // FIXME once bulk is working
  }

  return args;
} // prepareTransformArgs

/**
 * Handles the responses from the remote data sources by calling the transform
 * function for each, then sending the samples from all responses to Refocus.
 *
 * @param  {Object} collectResArray - Array of responses from the "collect"
 * function: each element is the generator object along with the "res"
 * attribute which maps to the response from the remote data source
 * @returns {Promise} - resolves to the response from the bulkUpsert request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function handleCollectResponseBySubject(collectResArray) {
  return Promise.map(collectResArray, (res) => generateSamples(res))
    .then((samplesBySubject) =>
      samplesBySubject.reduce((x, y) => [...x, ...y])
    )
    .then((samples) =>
      sendSamples(collectResArray[0], samples)
    );
} // handleCollectResponseBySubject

/**
 * Handles the response from the remote data source by calling the transform
 * function, then sending the samples from that response to Refocus.
 *
 * @param  {Object} collectRes - Response from the "collect" function: the
 * generator object along with the "res" attribute which maps to the response
 * from the remote data source
 * @returns {Promise} - resolves to the response from the bulkUpsert request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function handleCollectResponseBulk(collectRes) {
  debug('handleCollectResponse status %s, body %O', collectRes.res.status,
    collectRes.res.body);
  const samples = generateSamples(collectRes);
  return sendSamples(collectRes, samples);
} // handleCollectResponse

/**
 * Send samples to Refocus
 *
 * @param  {Object} collectRes - The generator object along with the "res"
 * attribute which maps to the response from the remote data source
 * @returns Promise - resolves to the response from the bulkUpsert request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function sendSamples(gen, samples) {
  // Validate each of the samples.
  samples.forEach(commonUtils.validateSample);
  logger.info({
    activity: 'upsert:samples',
    generator: gen.name,
    numSamples: samples.length,
  });
  const cr = configModule.getConfig().refocus;
  return httpUtils.doBulkUpsert(
    cr.url, gen.token, gen.intervalSecs, cr.proxy, samples
  );
}

/**
 * Use the transform function to generate samples.
 *
 * @param  {Object} collectRes - the generator object along with the "res"
 * attribute which maps to the response from the remote data source
 * @returns {Array} - The samples that were generated from the response
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function generateSamples(collectRes) {
  const tr = collectRes.generatorTemplate.transform;

  try {
    validateCollectResponse(collectRes, tr.responseSchema);
  } catch (err) {
    const errorMessage = `${err.message} (${collectRes.preparedUrl})`;
    return errorSamples(collectRes, errorMessage);
  }

  const args = prepareTransformArgs(collectRes);
  const status = collectRes.res.statusCode;

  /*
   * Figure out which transform function to use based on response status, or
   * if there is no transform designated for this HTTP status code and the
   * status is NOT one of the "OK" (2xx) statuses, generate "default" error
   * samples.
   */
  const func = RefocusCollectorEval.getTransformFunction(tr, status);
  if (func) {
    return RefocusCollectorEval.safeTransform(func, args);
  }

  // Default error samples
  const errorMessage = `${collectRes.preparedUrl} returned HTTP status ` +
    `${collectRes.res.statusCode}: ${collectRes.res.statusMessage}`;
  return errorSamples(collectRes, errorMessage);
} // generateSamples

module.exports = {
  handleCollectResponseBulk,
  handleCollectResponseBySubject,
  validateCollectResponse, // export for testing only
  prepareTransformArgs, // export for testing only
};
