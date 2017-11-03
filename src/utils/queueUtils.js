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
let queueObject;
const queueListObject = {};

/**
 * Create Queue using Buffered Queue Package
 *
 * @param  {Object} queueParams    Queue Parameter Object
 *                                 name, size, flushTimeout,
 *                                 verbose, flushFunction,
 */
function createQueue(queueParams) {
  queueObject = new Queue(queueParams.name, {
    size: queueParams.size,
    flushTimeout: queueParams.flushTimeout,
    verbose: queueParams.verbose,
  });

  queueListObject[queueParams.name] = queueObject;

  queueObject.on('flush', (data, name) => {
    queueParams.flushFunction(data);
  });
}

/**
 * Get queue based on Name
 * @param  {String} name Name of Queue
 * @return {Object}      Return Queue object
 */
function getQueue(name) {
  return queueListObject[name];
}

/**
 * Enqueue Data to queue from Array
 * @param  {String} name               Queue Name
 * @param  {Array} arrayData          Array of Data
 * @param  {Function} validationFunction Validation function to validate
 *                                       individiual element
 * @throws {ValidationError} if the object does not look like a sample
 */
function enqueueFromArray(name, arrayData, validationFunction=null) {
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

module.exports = {
  createQueue,
  getQueue,
  enqueueFromArray,
};
