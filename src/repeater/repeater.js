/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /src/repeater/repeater.js
 */
const debug = require('debug')('refocus-collector:repeater');
const repeat = require('repeat');
const logger = require('winston');
const errors = require('../errors/errors');
const handleCollectResponse =
  require('../remoteCollection/handleCollectResponse').handleCollectResponse;
const collect = require('../remoteCollection/collect').collect;

// Tracks all the repeats defined in the collectors.
const repeatTracker = {};

/**
 * The default function that is called every time a task is repeated.
 * @param {Object} result - The return value of one particular task
 *  invocation.
 */
function onProgress(result) {
  debug('onProgress: task was successfully repeated with ' +
    'the following response: ', result);
} // onProgress

/**
 * The default function that is called when all the repetition is complete.
 * @param {Array} results - An array of objects, where each element is the
 * return value for each invocation.
 */
function onSuccess(results) {
  debug('onSuccess: All the repeat tasks were completed with the ' +
  'the following response: ', results);
} // onSuccess

/**
 * The default function that is called when the task function invocation
 * throws an error.
 * @param {Object} err - Error thrown by the repeatable task.
 */
function onFailure(err) {
  logger.error(`onFailure: The task returned an error ${err}`);
} // onFailure

/**
 * Stops the repeat task identified by the name and deletes it from the
 * repeatTracker.
 * @param {String} name - Name of the repeat
 * @throws {ValidationError} If "obj" does not have a name attribute.
 * @throws {ResourceNotFoundError} If the repeat identified by obj.name is not
 * found in the tracker.
 */
function stop(name) {
  if (!name || !repeatTracker[name]) {
    throw new errors.ResourceNotFoundError(`Repeater "${name}" not found`);
  }

  repeatTracker[name].stop();
  delete repeatTracker[name];
  logger.info(`Stopping repeater identified by: ${name}`);
} // stop

/**
 * Validate the repeater definition.
 *
 * @param {Object} def - Repeater definition object with the following
 *  attributes:
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 *  {Function} func - required, function to execute repeatedly
 *  {Function} onSuccess - function to execute only once, after *all*
 *    of the scheduled repetitions have completed
 *  {Function} onFailure - function to execute if any repetition fails
 *  {Function} onProgress - function to execute upon completion of each
 *    repetition.
 * @throws {ValidationError} - If name/interval/func missing or incorrect type
 */
function validateDefinition(def) {
  if (!def.name || typeof def.name !== 'string') {
    throw new errors.ValidationError('Repeater definition must have a ' +
      'string attribute called "name".');
  }

  if (repeatTracker[def.name]) {
    throw new errors.ValidationError('Duplicate repeater name violation: ' +
      def.name);
  }

  if (!def.interval || typeof def.interval !== 'number') {
    throw new errors.ValidationError('Repeater definition must have a ' +
      'numeric attribute called "interval".');
  }

  if (!def.func || typeof def.func !== 'function') {
    throw new errors.ValidationError('Repeater definition must have a ' +
      'function attribute called "func".');
  }
} // validateDefinition

/**
 * Start a repeater and track it in the repeatTracker.
 *
 * @param {Object} def - Repeater definition object with the following
 *  attributes:
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 *  {Function} func - required, function to execute repeatedly
 *  {Function} onSuccess - function to execute only once, after *all*
 *    of the scheduled repetitions have completed
 *  {Function} onFailure - function to execute if any repetition fails
 *  {Function} onProgress - function to execute upon completion of each
 *    repetition.
 * @returns {Promise} - A read-only Promise instance
 * @throws {ValidationError} - Thrown by validateDefinition
 */
function create(def) {
  validateDefinition(def);
  const handle = repeat(def.func);
  handle.every(def.interval, 'ms').start.now();
  handle.then(def.onSuccess || onSuccess, def.onFailure || onFailure,
    def.onProgress || onProgress);
  repeatTracker[def.name] = handle;
  def.handle = handle;
  def.funcName = def.func.name;
  logger.info({
    activity: 'createdRepeater',
    name: def.name,
    funcName: def.func.name,
    interval: def.interval,
  });
  return def;
} // create

/**
 * Update the specified repeater.
 *
 * @param {Object} def - Repeater definition object with the following
 *  attributes:
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 *  {Function} func - required, function to execute repeatedly
 *  {Function} onSuccess - function to execute only once, after *all*
 *    of the scheduled repetitions have completed
 *  {Function} onFailure - function to execute if any repetition fails
 *  {Function} onProgress - function to execute upon completion of each
 *    repetition.
 * @returns {Promise} - A read-only Promise instance
 * @throws {ValidationError} - Thrown by validateDefinition
 */
function update(def) {
  stop(def.name);
  return create(def);
} // update

/**
 * Convenience function to create a new generator repeater.
 *
 * @param {Object} generator - The sample generator object
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 * @returns {Promise} - A read-only Promise instance.
 */
function createGeneratorRepeater(generator) {
  /**
   * Wrapping the collect function to pass a function defination to the repeat
   * task
   * @returns {Promise} which resolves to the response of the collect function
   */
  function collectWrapper() {
    return collect(generator);
  }

  const def = {
    name: generator.name,
    interval: generator.interval,
    func: collectWrapper,
  };

  def.func = collectWrapper;
  def.onProgress = handleCollectResponse;
  return create(def);
} // createGeneratorRepeater

/**
 * Convenience function to update a generator repeater.
 *
 * @param {Object} generator - The sample generator object
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 * @returns {Promise} - A read-only Promise instance.
 */
function updateGeneratorRepeater(generator) {
  /**
   * Wrapping the collect function to pass a function defination to the repeat
   * task
   * @returns {Promise} which resolves to the response of the collect function
   */
  function collectWrapper() {
    return collect(generator);
  }

  const def = {
    name: generator.name,
    interval: generator.interval,
    func: collectWrapper,
  };

  def.func = collectWrapper;
  def.onProgress = handleCollectResponse;
  return update(def);
} // updateGeneratorRepeater

module.exports = {
  create,
  createGeneratorRepeater,
  repeatTracker, // export for testing only
  stop,
  update,
  updateGeneratorRepeater,
  validateDefinition, // export for testing only
};
