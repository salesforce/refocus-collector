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
const ZERO = 0;

/**
 * Validates the response from the collect function. Confirms that it is an
 * object and has "res" and "name" attributes.
 *
 * @param {Object} requestData - data specific to this request
 * @param {Object} resSchema - The response schema
 * @throws {ValidationError} If the response is not valid.
 */
function validateCollectResponse({ preparedUrl, preparedHeaders, res }, resSchema) {
  if (!preparedUrl) {
    throw new errors.ValidationError('The argument passed to the ' +
      '"handleCollectResponse" function must have a "preparedUrl" attribute.');
  }

  // No response.
  if (!res) {
    throw new errors.ValidationError(`No response from ${preparedUrl}`);
  }

  // It's already an error!
  if (res instanceof Error) {
    if (res.hasOwnProperty('retries')) {
      res.message += ` (${res.retries} retries)`;
    }

    throw res;
  }

  // Invalid response: missing status code.
  if (!res.hasOwnProperty('statusCode')) {
    logger.error(`Invalid response from ${preparedUrl}: ` +
      'missing HTTP status code', res);
    throw new errors.ValidationError('Invalid response from ' +
      `${preparedUrl}: missing HTTP status code`);
  }

  // Expecting response status code to be 3 digits.
  if (!(/\d\d\d/).test(res.statusCode)) {
    logger.error(`Invalid response from ${preparedUrl}: ` +
      `invalid HTTP status code "${res.statusCode}"`, res);
    throw new errors.ValidationError('Invalid response from ' +
      `${preparedUrl}: invalid HTTP status code "${res.statusCode}"`);
  }

  // Response "Content-Type" header matches request "Accept" header?
  RefocusCollectorEval.validateResponseType(preparedHeaders, res.headers);

  // Response matches schema?
  if (resSchema) {
    RefocusCollectorEval.validateResponseBody(res, resSchema);
  }
} // validateCollectResponse

/**
 * Prepare arguments to be passed to the transform function.
 *
 * @param {Object} generator - The generator object
 * @param {Array} subjects - The subjects used to make the request
 * @param {Object} res - The response from the remote data source
 * @throws {Error} - TransformError if transform function does not return an
 *  array of zero or more samples
 * @throws {Error} - ValidationError if any of the validation checks fail
 * @returns {Object} the transform args
 */
function prepareTransformArgs(generator, subjects, res) {
  const args = {
    ctx: generator.context,
    res: res,
    aspects: generator.aspects,
  };
  if (commonUtils.isBulk(generator)) {
    args.subjects = subjects;
  } else {
    args.subject = subjects[ZERO];
  }

  return args;
} // prepareTransformArgs

/**
 * Use the transform function to generate samples.
 *
 * @param {Object} generator - The generator object
 * @param {Object} requestData - data specific to this request
 * @returns {Array} - The samples that were generated from the response
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function generateSamples(generator, requestData) {
  const { subjects, preparedUrl, preparedHeaders, res } = requestData;
  const tr = generator.generatorTemplate.transform;
  const resSchema = tr.responseSchema;

  try {
    validateCollectResponse(requestData, resSchema);
  } catch (err) {
    const errorMessage = `${err.message} (${preparedUrl})`;
    return errorSamples(generator.name, generator.aspects, subjects, errorMessage);
  }

  const args = prepareTransformArgs(generator, subjects, res);
  const status = res.statusCode;

  /*
   * Figure out which transform function to use based on response status, or
   * if there is no transform designated for this HTTP status code and the
   * status is NOT one of the "OK" (2xx) statuses, generate "default" error
   * samples.
   */
  const func = RefocusCollectorEval.getTransformFunction(tr, status);
  if (func) {
    try {
      return RefocusCollectorEval.safeTransform(func, args);
    } catch (err) {
      const errorMessage = `Transform error: ${err.message} (${preparedUrl})`;
      return errorSamples(generator.name, generator.aspects, subjects, errorMessage);
    }
  }

  // Default error samples
  const errorMessage = `${preparedUrl} returned HTTP status ` +
    `${res.statusCode}: ${res.statusMessage}`;
  return errorSamples(generator.name, generator.aspects, subjects, errorMessage);
} // generateSamples

/**
 * Validate the samples then send to Refocus using bulk upsert.
 *
 * @param  {Object} gen - The generator object
 * @param  {Array<Object>} samples - The array of samples to send
 * @returns {Promise<Object>} - resolves to the response from the bulkUpsert
 *  request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function sendSamples(gen, samples) {
  samples.forEach(commonUtils.validateSample);
  logger.info({
    activity: 'upsert:samples',
    generator: gen.name,
    numSamples: samples.length,
  });
  const cr = configModule.getConfig().refocus;
  return httpUtils.doBulkUpsert(cr.url, gen.token, gen.intervalSecs, cr.proxy,
    samples);
} // sendSamples

/**
 * Handles the responses from the remote data sources by calling the transform
 * function for each, then sending the samples from all responses to Refocus.
 *
 * @param {Object} generator - The generator object
 * @param {Array} requestDataList - Array of objects representing a request to the
 *  remote data source.
 * @returns {Promise} - resolves to the response from the bulkUpsert request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function handleCollectResponseBySubject(generator, requestDataList) {
  const samples = requestDataList
                  .map((requestData) => generateSamples(generator, requestData))
                  .reduce((x, y) => [...x, ...y], []);
  return sendSamples(generator, samples);
} // handleCollectResponseBySubject

/**
 * Handles the response from the remote data source by calling the transform
 * function, then sending the samples from that response to Refocus.
 *
 * @param {Object} generator - The generator object
 * @param {Object} requestData - data specific to this request
 * @returns {Promise} - resolves to the response from the bulkUpsert request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function handleCollectResponseBulk(generator, requestData) {
  debug('handleCollectResponse status %s, body %O', requestData.res.status, requestData.res.body);
  const samples = generateSamples(generator, requestData);
  return sendSamples(generator, samples);
} // handleCollectResponse

/**
 * Handle errors during collection by sending error samples
 *
 * @param  {Object} generator - The generator object
 * @param  {Error} err - The error that was thrown during collection
 * @returns {Promise<Object>} - resolves to the response from the bulkUpsert
 *  request
 * @throws {ValidationError} if thrown by validateCollectResponse
 */
function handleCollectError(generator, err) {
  if (!err.subjects) {
    logger.error('Collection error! Cannot generate error samples!', err);
    return Promise.resolve();
  }

  return sendSamples(
    generator,
    errorSamples(generator.name, generator.aspects, err.subjects, err.message)
  )
} // sendSamples

module.exports = {
  handleCollectResponseBulk,
  handleCollectResponseBySubject,
  handleCollectError,
  validateCollectResponse, // export for testing only
  prepareTransformArgs, // export for testing only
};
