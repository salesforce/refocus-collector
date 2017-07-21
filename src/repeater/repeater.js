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
const errors = require('../config/errors');
const handleCollectResponse =
  require('../remoteCollection/handleCollectResponse').handleCollectResponse;
const collect = require('../remoteCollection/collect').collect;

/**
 * Tracks all the repeats defined in the collectors.
 * The repeatTracker object looks like
 *  {
 *    'heartbeat': repeatHandle,
 *    'sampleQueueFlush': repeatHandle,
 *    'generator1' : { // when bulk is true
 *      _bulk: repeatHandle,
 *    }
 *    'generator2' : { // when bullk is false
 *      subject1: repeatHandle,
 *      subject2: repeatHandle,
 *    }
 *  }
 *
 */
const repeatTracker = {};

/**
 * Update the repeatTracker object to track new repeats
 * @param  {Object} def - Repeater definition object
 */
function trackRepeat(def) {
  if (!def.hasOwnProperty('bulk')) {
    repeatTracker[def.name] = def.handle;
  } else if (def.bulk === true) {
    repeatTracker[def.name] = { _bulk: def.handle };
  } else if (def.bulk === false && repeatTracker[def.name]) {
    repeatTracker[def.name][def.subject.absolutePath] = def.handle;
  } else if (def.bulk === false && !repeatTracker[def.name]) {
    repeatTracker[def.name] = { [def.subject.absolutePath]: def.handle };
  }
} // trackRepeat

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

  if (repeatTracker[name].stop) {
    repeatTracker[name].stop();
  } else {
    Object.keys(repeatTracker[name]).forEach((prop) => {
      repeatTracker[name][prop].stop();
      delete repeatTracker[name][prop];
    });
  }

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

  if ((repeatTracker[def.name] && !def.hasOwnProperty('bulk')) ||
    (repeatTracker[def.name] && (repeatTracker[def.name][def.subject.absolutePath] ||
      repeatTracker[def.name]._bulk))) {
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
  def.handle = handle;
  def.funcName = def.func.name;
  trackRepeat(def);
  logger.info({
    activity: 'createdRepeater',
    name: def.name,
    funcName: def.func.name,
    interval: def.interval,
  });
  return def;
} // create

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
   * Wrapping the collect function to pass a function definition to the repeat
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
    onProgress: handleCollectResponse,
    bulk: generator.generatorTemplate.connection.bulk,
    subject: generator.subject,
  };
  return create(def);
} // createGeneratorRepeater

module.exports = {
  create,
  createGeneratorRepeater,
  repeatTracker, // export for testing only
  stop,
  validateDefinition, // export for testing only
};
