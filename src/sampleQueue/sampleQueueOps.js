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
const config = require('../config/config').getConfig();
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
 * @throws {ValidationError} - If config or registry is not found
 */
function bulkUpsertAndLog(samples) {
  debug('Entered: bulkUpsertAndLog');
  if (!config || !config.registry ||
   Object.keys(config.registry).length === 0) {
    throw new errors.ValidationError(
      `Registry empty or not found. Config: ${JSON.stringify(config)}`
    );
  }

  // TODO: change when Refocus registry name is decided.
  // For now, get only the values mapped to the first attribute of registry
  debug(`Starting bulk upsert of ${samples.length} samples.`);
  sampleUpsertUtils.doBulkUpsert(
    config.registry[Object.keys(config.registry)[0]], samples
  )
  .then(() => {
    logger.info(`sampleQueue flush successful for : ${samples.length} samples`);
  })
  .catch((err) => {
    logger.error(
      `sampleQueue flush failed for : ${samples.length} samples.` +
      `Error: ${JSON.stringify(err)}`);
  });
}

/**
 * Flush the queue. If maxSamplesPerBulkRequest is set, bulk upsert the samples
 * in batches of maxSamplesPerBulkRequest count.
 */
function flush() {
  debug('Entered: flush');
  let maxSamplesCnt;
  if (config.collectorConfig.hasOwnProperty('maxSamplesPerBulkRequest')) {
    maxSamplesCnt = config.collectorConfig.maxSamplesPerBulkRequest;
  }

  const totSamplesCnt = sampleQueue.length;
  let samples = sampleQueue;
  if (samples.length) {
    // If maxSamplesPerBulkRequest set, bulk upsert in batches.
    if (maxSamplesCnt) {
      let startIdx = 0;
      while ((startIdx + maxSamplesCnt) < totSamplesCnt) {
        const endIdx = startIdx + maxSamplesCnt;
        samples = sampleQueue.slice(startIdx, endIdx);

        bulkUpsertAndLog(samples);
        startIdx = endIdx;
      }

      samples = sampleQueue.slice(startIdx, totSamplesCnt);
    }

    bulkUpsertAndLog(samples);
    sampleQueue.splice(0, totSamplesCnt); // remove these samples from queue.
    debug(`Flushed ${totSamplesCnt} samples.`);
  } else {
    debug(`Nothing to flush.`);
  }
}

module.exports = {
  enqueue,
  flush,
  sampleQueue, // for testing purposes
  bulkUpsertAndLog, // for testing purposes
  validateSample, // for testing purposes
};
