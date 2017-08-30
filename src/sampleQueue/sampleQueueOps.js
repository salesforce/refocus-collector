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
const errors = require('../config/errors');
const sampleSchema = require('../utils/schema').sample;
const sampleQueue = [];

/**
 * Validates the sample.
 *
 * @param {Object} sample - The sample to validate
 * @returns {Object} the valid sample
 * @throws {ValidationError} if the object does not look like a sample
 */
function validateSample(sample) {
  const val = sampleSchema.validate(sample);
  if (val.error) {
    throw new errors.ValidationError(val.error.message);
  }

  return sample;
}

/**
 * Enqueue samples in sample queue.
 *
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
    logger.info(`Enqueue successful for ${samples.length} samples`);
  } catch (err) {
    logger.error(`Enqueue failed: ${err}`);
  }
}

/**
 * Bulk upsert samples and log the success or failure.
 *
 * @param  {Array} samples - Array of samples
 * @param  {Object} refocusInst - The Refocus instance
 * @throws {ValidationError} - If missing refocusInst
 */
function bulkUpsertAndLog(samples, refocusInst) {
  debug('Entered: bulkUpsertAndLog');
  if (!refocusInst) {
    throw new errors.ValidationError('Missing refocusInst');
  }

  debug(`Starting bulk upsert of ${samples.length} samples.`);
  sampleUpsertUtils.doBulkUpsert(refocusInst, samples)
  .then(() => logger.info({
    activity: 'bulkUpsertSamples',
    sampleCount: samples.length,
  }))
  .catch((err) => logger.error(`doBulkUpsert failed for ${samples.length} ` +
    `samples: ${JSON.stringify(err)}`));
} // bulkUpsertAndLog

/**
 * Flush the queue. If maxSamplesPerBulkRequest is set, bulk upsert the samples
 * in batches of maxSamplesPerBulkRequest count.
 *
 * @param {Number} maxSamplesPerBulkRequest - the maximum batch size; unlimited
 * @param  {Object} refocusInst - The Refocus instance
 * @returns {Number} - number of samples flushed
 */
function flush(maxSamplesPerBulkRequest, refocusInst) {
  debug('Entered: flush', maxSamplesPerBulkRequest, refocusInst.name);
  const max = new Number(maxSamplesPerBulkRequest) || Number.MAX_SAFE_INTEGER;
  const totSamplesCnt = sampleQueue.length;
  let samples = sampleQueue;
  let startIdx = 0;
  while ((startIdx + max) < totSamplesCnt) {
    const endIdx = startIdx + max;
    samples = sampleQueue.slice(startIdx, endIdx);
    bulkUpsertAndLog(samples, refocusInst);
    startIdx = endIdx;
  }

  samples = sampleQueue.slice(startIdx, totSamplesCnt);
  bulkUpsertAndLog(samples, refocusInst);
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
