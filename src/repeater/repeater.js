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
const logger = require('winston');
const errors = require('../errors');
const repeaterSchema = require('../utils/schema').repeater;
const heartbeatRepeatName = require('../constants').heartbeatRepeatName;
let hbFunc;

/**
 * Tracks all the repeaters defined in the collectors.
 * Each key in the tracker is the name of the repeater ('heartbeat', or a
 * generator name), and the value is the repeater handle object.
 */
const tracker = {};

function notHeartbeat(key) {
  return key !== heartbeatRepeatName;
} // notHeartbeat

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
 * Stops the named repeater and deletes it from the tracker.
 *
 * @param {String} name - Name of the repeat
 * @throws {ValidationError} If "obj" does not have a name attribute.
 */
function stop(name) {
  debug('stop %s', name);
  if (!name || !tracker[name]) {
    logger.error(`Repeater "${name}" not found`);
    return;
  }

  if (tracker[name].intervalId) {
    clearInterval(tracker[name].intervalId);
  }

  delete tracker[name];
  logger.info({
    activity: 'repeater:stopped',
    name,
  });
  debug('now tracking %O', Object.keys(tracker));
} // stop

/**
 * Pauses the repeater, given its name
 * @param  {String} name - Name of the repeat
 */
function pause(name) {
  debug('pause %s', name);
  if (!name || !tracker[name]) {
    throw new errors.ResourceNotFoundError(`Repeater "${name}" not found`);
  }

  if (tracker[name].intervalId) {
    clearInterval(tracker[name].intervalId);
    delete tracker[name].intervalId;
  }

  logger.info({
    activity: 'repeater:paused',
    name,
  });
} // pause

function getPaused() {
  return Object.values(tracker)
    .filter(gen => !gen.intervalId)
    .map(gen => gen.name);
}

/**
 * Resumes a paused repeater, given its name
 * @param  {String} name - Name of the repeat
 */
function resume(name) {
  debug('resume %s', name);
  if (!name || !tracker[name]) {
    throw new errors.ResourceNotFoundError(`Repeater "${name}" not found`);
  }

  if (!tracker[name].intervalId) {
    const def = tracker[name];
    delete tracker[name];
    create(def);
  }

  logger.info({
    activity: 'repeater:resumed',
    name,
  });
} // resume

/**
 * Stop all the generator repeaters.
 */
function stopGenerators() {
  debug('stopGenerators');
  Object.keys(tracker).filter(notHeartbeat).forEach(stop);
} // stopGenerators

/**
 * Pauses all the generator repeaters.
 */
function pauseGenerators() {
  debug('pauseGenerators');
  Object.keys(tracker).filter(notHeartbeat).forEach(pause);
} // pauseGenerators

/**
 * Resumes all the generator repeaters.
 */
function resumeGenerators() {
  debug('pauseGenerators');
  Object.keys(tracker).filter(notHeartbeat).forEach(resume);
} // resumeGenerators

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
 * Validate the repeater definition.
 *
 * @param {Object} def - Repeater definition object with the following
 *  attributes:
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 *  {Function} func - required, function to execute repeatedly
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
 * @throws {ValidationError} - Thrown by validateDefinition
 */
function create(def) {
  validateDefinition(def);
  debug('create %O', def);
  def.intervalId = setInterval(def.func, def.interval);
  tracker[def.name] = def;
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
 *
 * @throws {ValidationError} - Thrown by validateDefinition, called by
 *  repeater.create
 */
function createGeneratorRepeater(generator, func) {
  return create({
    name: generator.name,
    interval: 1000 * generator.intervalSecs, // convert to millis
    func: () => func(generator).catch(onFailure),
  });
} // createGeneratorRepeater

/**
* Convenience function to create a new heartbeat repeater.
*
* @throws {ValidationError} - Thrown by validateDefinition, called by
*  repeater.create
*/
function createHeartbeatRepeater(func, interval) {
  hbFunc = func;
  return create({
    name: heartbeatRepeatName,
    interval,
    func: () => func().catch(onFailure),
  });
} // createHeartbeatRepeater

/**
 * Convenience function to update the heartbeat repeater
 *
 * @throws {ValidationError} - Thrown by stop, createHeartbeatRepeater
 */
function updateHeartbeatRepeater(interval) {
  if (hbFunc && interval) {
    stop(heartbeatRepeatName);
    createHeartbeatRepeater(hbFunc, interval);
  }
} // updateHeartbeatRepeater

module.exports = {
  create,
  createGeneratorRepeater,
  createHeartbeatRepeater,
  updateHeartbeatRepeater,
  stop,
  pause,
  resume,
  stopGenerators,
  pauseGenerators,
  resumeGenerators,
  stopAllRepeaters,
  getPaused,
  tracker,
  validateDefinition, // export for testing only
};
