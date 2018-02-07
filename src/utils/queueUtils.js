/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/queueUtils.js
 */
'use strict'; // eslint-disable-line strict
const logger = require('winston');
const Queue = require('buffered-queue');
const errors = require('../errors');
const debug = require('debug')('refocus-collector:commonUtils');
const httpUtils = require('./httpUtils');
const configModule = require('../config/config');

let queueObject;
const queueListObject = {};

/**
 * Create a buffered queue object using the passed in 'queueParams' and add it
 * to a list of buffered queue objects
 * @param  {Object} queueParams    Queue Parameter Object
 *                                 name, size, flushTimeout,
 *                                 verbose, flushFunction,
 * @returns {Object} The created buffered queue object
 */
function createQueue(queueParams) {
  debug('Entered queueUtils.createQueue', queueParams);
  queueObject = new Queue(queueParams.name, {
    size: queueParams.size,
    flushTimeout: queueParams.flushTimeout,
    verbose: queueParams.verbose,
  });

  queueListObject[queueParams.name] = queueObject;

  queueObject.on('flush', (data, name) => {
    queueParams.flushFunction(data, queueParams.token);
  });

  return queueObject;
}

/**
 * Get the buffered queue instance by its name
 * @param  {String} name - Name of the buffered queue instance
 * @returns {Object} returns the buffered queue object
 */
function getQueue(name) {
  return queueListObject[name];
}

/**
 * Enqueues data to the buffered queue from array, to be later flushed from the
 * queue
 * @param  {String} name - Name of the buffered queue
 * @param  {Array} arrayData - Data to be affed to the buffered queue
 * @param  {Function} validationFunction - Validation function to validate
 * individual element
 * @throws {ValidationError} if the object does not look like a sample
 */
function enqueueFromArray(name, arrayData, validationFunction) {
  const queue = queueListObject[name];
  try {
    arrayData.forEach((data) => {
      if (validationFunction) {
        validationFunction(data);
      }

      queue.add(data);
    });
  } catch (err) {
    logger.error(`Enqueue failed: ${err}`);
    throw new errors.ValidationError(err.error);
  }
}

/**
 * Flushes the buffered queue that has been created for each of the generator
 */
function flushAllBufferedQueues() {
  Object.keys(queueListObject).forEach((bq) => {
    queueListObject[bq].onFlush();
  });
} // flushAllBufferedQueues

/**
 * Create or update queue for sample generator
 * @param  {String} qName - Queue name
 * @param  {String} refocusUserToken - User token
 * @param  {Object} collConf - The collectorConfig from the start or heartbeat
 *  response
 */
function createOrUpdateGeneratorQueue(qName, refocusUserToken, collConf) {
  if (!qName) {
    debug('Error: qName not found. Supplied %s', qName);
    throw new errors.ValidationError('Missing queue name.');
  }

  const bq = getQueue(qName); // get bulk update queue
  if (bq) { // queue matching this name already exists
    if (!collConf) {
      debug('Error: collConf not found. Supplied %s', collConf);
      throw new errors.ValidationError('Missing collectorConfig.');
    }

    // update queue params
    if (collConf.maxSamplesPerBulkRequest) {
      bq._size = collConf.maxSamplesPerBulkRequest;
    }

    if (collConf.sampleUpsertQueueTime) {
      bq._flushTimeout = collConf.sampleUpsertQueueTime;
    }
  } else { // create queue
    const config = configModule.getConfig();
    const queueParams = {
      name: qName,
      size: config.refocus.maxSamplesPerBulkRequest,
      flushTimeout: config.refocus.sampleUpsertQueueTime,
      verbose: false,
      flushFunction: httpUtils.doBulkUpsert,
      token: refocusUserToken,
    };
    createQueue(queueParams);
  }
} // createOrUpdateGeneratorQueue

module.exports = {
  createOrUpdateGeneratorQueue,
  createQueue,
  getQueue,
  enqueueFromArray,
  flushAllBufferedQueues,
  queueListObject,
};
