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
const repeaterSchema = require('../utils/schema').repeater;
const heartbeatRepeatName = require('../constants').heartbeatRepeatName;
const u = require('../utils/commonUtils');

/**
 * Tracks all the repeaters defined in the collectors.
 * Each key in the tracker is the name of the repeater ('heartbeat', or a
 * generator name), and the value is the repeater handle object.
 */
const tracker = {};

// Track the names of paused repeaters.
const paused = new Set();

function notHeartbeat(key) {
  return key !== heartbeatRepeatName;
} // notHeartbeat

/**
 * Update the tracker object to track the new repeater.
 *
 * @param  {Object} def - Repeater definition object
 */
function trackRepeater(def) {
  debug('trackRepeater %s', def.name);
  tracker[def.name] = def.handle;
  debug('now tracking %O', Object.keys(tracker));
} // trackRepeater

/**
 * The default function that is called every time a task is repeated.
 *
 * @param {Object} result - The return value of one particular task
 *  invocation.
 */
function onProgress(result) {
  debug('onProgress: task was successfully repeated %O', result);
} // onProgress

/**
 * The default function that is called when all the repetition is complete.
 * @param {Array} results - An array of objects, where each element is the
 * return value for each invocation.
 */
function onSuccess(results) {
  debug('onSuccess: all repeat tasks completed %O', results);
} // onSuccess

/**
 * The default function that is called when the task function invocation throws
 * an error.
 *
 * @param {Object} err - Error thrown by the repeatable task.
 */
function onFailure(err) {
  debug('onFailure %O', err);
  logger.error(`onFailure: task returned error: ${err.message}`);
} // onFailure

/**
 * Changes the state of a repeater, given the repeater name and its new state.
 * For example to pause a repeater named "foo", call
 * changedRepatState(foo, pause).
 * @param {String} name - Name of the repeat
 * @param {String} newState - New start of the repeat
 */
function changeRepeatState(name, newState) {
  debug('changeRepeatState %s to %s', name, newState);
  if (!name || !tracker[name]) {
    throw new errors.ResourceNotFoundError(`Repeater "${name}" not found`);
  }

  if (tracker[name][newState]) {
    tracker[name][newState]();
  } else {
    Object.keys(tracker[name]).forEach((prop) => {
      if (tracker[name][prop][newState]) {
        tracker[name][prop][newState]();
      }
    });
  }
} // changeRepeatState

/**
 * Stops the named repeater and deletes it from the tracker.
 *
 * @param {String} name - Name of the repeat
 * @throws {ValidationError} If "obj" does not have a name attribute.
 */
function stop(name) {
  debug('stop %s', name);
  try {
    changeRepeatState(name, 'stop');
  } catch (err) {
    logger.error(err);
  }

  delete tracker[name];
  paused.delete(name);
  logger.info({
    activity: 'repeater:stopped',
    name,
  });
  debug('now tracking %O', Object.keys(tracker));
} // stop

/**
 * Stops all the repeats tracked in the repeat tracker and clears them from the
 * tracker.
 * @returns {Object} The tracker object tracking all the repeats
 */
function stopAllRepeaters() {
  debug('stopAllRepeaters');
  Object.keys(tracker).forEach(stop);
  debug('now tracking %O', Object.keys(tracker));
  return tracker;
} // stopAllRepeaters

/**
 * Pauses the repeater, given its name
 * @param  {String} name - Name of the repeat
 */
function pause(name) {
  debug('pause %s', name);
  changeRepeatState(name, 'pause');
  paused.add(name);
  logger.info({
    activity: 'repeater:paused',
    name,
  });
} // pause

/**
 * Pauses all the generator repeaters.
 */
function pauseGenerators() {
  debug('pauseGenerators');
  Object.keys(tracker).filter(notHeartbeat).forEach(pause);
} // pauseGenerators

/**
 * Resumes a paused repeater, given its name
 * @param  {String} name - Name of the repeat
 */
function resume(name) {
  debug('resume %s', name);
  changeRepeatState(name, 'resume');
  paused.delete(name);
  logger.info({
    activity: 'repeater:resumed',
    name,
  });
} // resume

/**
 * Resumes all the generator repeaters.
 */
function resumeGenerators() {
  debug('pauseGenerators');
  Object.keys(tracker).filter(notHeartbeat).forEach(resume);
} // resumeGenerators

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
  debug('validateDefinition %O', def);
  const val = repeaterSchema.validate(def);
  if (val.error) {
    debug('validateDefinition error', val);
    throw new errors.ValidationError(val.error.message);
  }

  if (tracker[def.name]) {
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
  debug('create %O', def);
  const handle = repeat(def.func);
  handle.every(def.interval, 'ms').start.now();
  handle.then(def.onSuccess || onSuccess, def.onFailure || onFailure,
    def.onProgress || onProgress);
  def.handle = handle;
  def.funcName = def.func.name;
  trackRepeater(def);
  logger.info({
    activity: 'repeater:created',
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
 *  {Number} intervalSecs - required, repeat interval in milliseconds
 * @param {Function} func - pass in the function to call on each interval
 * @param {Function} onProgress - pass in the function call after each
 *  repetition
 * @returns {Promise} - A read-only Promise instance.
 * @throws {ValidationError} - Thrown by validateDefinition, called by
 *  repeater.create
 */
function createGeneratorRepeater(generator, func, onProgress) {
  return create({
    name: generator.name,
    interval: 1000 * generator.intervalSecs, // convert to millis
    func: () => func(generator),
    onProgress,
    bulk: u.isBulk(generator),
  });
} // createGeneratorRepeater

module.exports = {
  create,
  createGeneratorRepeater,
  pause,
  paused,
  pauseGenerators,
  resume,
  tracker,
  resumeGenerators,
  stop,
  stopAllRepeaters,
  validateDefinition, // export for testing only
};
