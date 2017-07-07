/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /src/sampleQueue/sampleQueueOps.js
 */
const debug = require('debug')('refocus-collector:sampleQueue');
const logger = require('winston');
const sampleUpsertUtils = require('./sampleUpsertUtils');
const errors = require('../errors/errors');
const sampleQueue = [];

/**
 * @param {Object} sample - The sample to validate
 * @throws {ValidationError} if the object does not look like a sample
 */
function validateSample(sample) {
  if (
    typeof sample === 'object' && !Array.isArray(sample) &&
    sample.hasOwnProperty('name') && typeof sample.name === 'string' &&
    sample.name.length >= 3 && sample.name.indexOf('|') > 0
  ) {
    return;
  }

  throw new errors.ValidationError(
    `Invalid sample: ${JSON.stringify(sample)}`
  );
}

/**
 * Enqueue samples in sample queue.
 * @param  {Array} samples - Array of samples
 * @throws {ValidationError} - If Invalid sample
 */
function enqueue(samples) {
  try {
    debug(`Starting to push ${samples.length} samples in sampleQueue.`);
    samples.forEach((sample) => {
      validateSample(sample);
      sampleQueue.push(sample);
    });
    logger.info(`Enqueue successful for : ${samples.length} samples`);
  } catch (err) {
    logger.error(`Enqueue failed. Error: ${err}`);
  }
}

/**
 * Bulk upsert samples and log the success or failure
 * @param  {Array} samples - Array of samples
 * @param  {Object} firstKeyPairInRegistry - The first pair of
 *  key and value in registry. Change when Refocus registry name is
 *  decided.
 * @throws {ValidationError} - If firstKeyPairInRegistry is not found
 */
function bulkUpsertAndLog(samples, firstKeyPairInRegistry) {
  debug('Entered: bulkUpsertAndLog');
  if (!firstKeyPairInRegistry ||
    Object.keys(firstKeyPairInRegistry).length === 0) {
    throw new errors.ValidationError(
      `firstKeyPairInRegistry empty or not found.` +
      ` Registry: ${JSON.stringify(firstKeyPairInRegistry)}`
    );
  }

  debug(`Starting bulk upsert of ${samples.length} samples.`);

  sampleUpsertUtils.doBulkUpsert(
    firstKeyPairInRegistry[Object.keys(firstKeyPairInRegistry)[0]], samples
  )
  .then(() => {
    logger.info({
      activity: 'bulkUpsertSamples',
      sampleCount: samples.length,
    });
  })
  .catch((err) => {
    logger.error(
      `doBulkUpsert failed for ${samples.length} samples.` +
      `Error: ${JSON.stringify(err)}`);
  });
}

/**
 * Flush the queue. If maxSamplesPerBulkRequest is set, bulk upsert the samples
 * in batches of maxSamplesPerBulkRequest count.
 *
 * @param {Number} maxSamplesPerBulkRequest - the maximum batch size; unlimited
 * @param  {Object} firstKeyPairInRegistry - The first pair of
 *  key and value in registry. Change when Refocus registry name is
 *  decided.
 *  batch size if arg is not defined or not a number
 * @returns {Number} - number of samples flushed
 */
function flush(maxSamplesPerBulkRequest, firstKeyPairInRegistry) {
  debug('Entered: flush', maxSamplesPerBulkRequest);
  const max = new Number(maxSamplesPerBulkRequest) || Number.MAX_SAFE_INTEGER;
  const totSamplesCnt = sampleQueue.length;
  let samples = sampleQueue;
  let startIdx = 0;
  while ((startIdx + max) < totSamplesCnt) {
    const endIdx = startIdx + max;
    samples = sampleQueue.slice(startIdx, endIdx);
    bulkUpsertAndLog(samples, firstKeyPairInRegistry);
    startIdx = endIdx;
  }

  samples = sampleQueue.slice(startIdx, totSamplesCnt);
  bulkUpsertAndLog(samples, firstKeyPairInRegistry);
  sampleQueue.splice(0, totSamplesCnt); // remove these samples from queue.
  debug(`Flushed ${totSamplesCnt} samples.`);
  return totSamplesCnt;
}

module.exports = {
  enqueue,
  flush,
  sampleQueue, // for testing purposes
  bulkUpsertAndLog, // for testing purposes
  validateSample, // for testing purposes
};
