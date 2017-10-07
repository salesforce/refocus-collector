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
const errors = require('../errors');
const handleCollectResponse =
  require('../remoteCollection/handleCollectResponse').handleCollectResponse;
const collect = require('../remoteCollection/collect').collect;
const repeaterSchema = require('../utils/schema').repeater;
const u = require('../utils/commonUtils');

/**
 * Tracks all the repeaters defined in the collectors.
 * The tracker object looks like this:
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
 */
const tracker = {};

/**
 * Update the tracker object to track the new repeater.
 *
 * @param  {Object} def - Repeater definition object
 */
function trackRepeater(def) {
  if (!def.hasOwnProperty('bulk')) {
    tracker[def.name] = def.handle;
  } else if (def.bulk === true) {
    tracker[def.name] = { _bulk: def.handle };
  } else if (def.bulk === false && tracker[def.name]) {
    tracker[def.name][def.subjects[0].absolutePath] = def.handle;
  } else if (def.bulk === false && !tracker[def.name]) {
    tracker[def.name] = { [def.subjects[0].absolutePath]: def.handle };
  }
} // trackRepeater

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
 * Stops the named repeater and deletes it from the tracker.
 *
 * @param {String} name - Name of the repeat
 * @throws {ValidationError} If "obj" does not have a name attribute.
 * @throws {ResourceNotFoundError} If the repeat identified by obj.name is not
 * found in the tracker.
 */
function stop(name) {
  if (!name || !tracker[name]) {
    throw new errors.ResourceNotFoundError(`Repeater "${name}" not found`);
  }

  if (tracker[name].stop) {
    tracker[name].stop();
  } else {
    Object.keys(tracker[name]).forEach((prop) => {
      tracker[name][prop].stop();
      delete tracker[name][prop];
    });
  }

  delete tracker[name];
  logger.info(`Stopped repeater identified by: ${name}`);
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
 * @throws {ValidationError} - Invalid repeater def or name collision
 */
function validateDefinition(def) {
  debug('validateDefinition', def);
  const val = repeaterSchema.validate(def);
  if (val.error) {
    throw new errors.ValidationError(val.error.message);
  }

  if ((tracker[def.name] && !def.hasOwnProperty('bulk')) ||
    (tracker[def.name] &&
      (tracker[def.name][def.subjects[0].absolutePath] ||
      tracker[def.name]._bulk))) {
    throw new errors.ValidationError('Duplicate repeater name violation: ' +
      def.name);
  }
} // validateDefinition

/**
 * Start a repeater and track it in the tracker.
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
  trackRepeater(def);
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
  return create({
    name: generator.name,
    interval: generator.interval,
    func: () => collect(generator),
    onProgress: handleCollectResponse,
    bulk: u.isBulk(generator),
    subjects: generator.subjects,
  });
} // createGeneratorRepeater

module.exports = {
  create,
  createGeneratorRepeater,
  tracker, // export for testing only
  stop,
  validateDefinition, // export for testing only
};
