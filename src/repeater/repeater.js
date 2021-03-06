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
const commonUtils = require('../utils/commonUtils');
const { collectBulk, collectBySubject } = require('../remoteCollection/collect');
const { handleCollectResponseBulk, handleCollectResponseBySubject, handleCollectError }  =
  require('../remoteCollection/handleCollectResponse');
const MILLISECONDS_PER_SECOND = 1000;
const ZERO = 0;
const ONE = 1;
const offsetInterval = 1;
const offsetSpace = 60;
let startOffset = ZERO;
let hbFunc;

/**
 * Tracks all the repeaters defined in the collectors.
 * Each key in the tracker is the name of the repeater ('heartbeat', or a
 * generator name), and the value is the repeater handle object.
 */
const tracker = {};

/**
 * Returns true if the key is *not* heartbeat (e.g. if it is a generator
 * repeater).
 *
 * @param {String} key - the repeater key
 * @returns {Boolean} true if the key is not heartbeat
 */
function notHeartbeat(key) {
  return key !== heartbeatRepeatName;
} // notHeartbeat

/**
 * The default function that is called when the repeater function throws
 * an error.
 *
 * @param {Object} err - Error thrown by the repeatable task.
 */
function onFailure(err) {
  logger.error('onFailure: task returned error:', err);
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

  if (tracker[name].timeoutId) {
    clearTimeout(tracker[name].timeoutId);
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

  if (tracker[name].timeoutId) {
    clearTimeout(tracker[name].timeoutId);
    delete tracker[name].timeoutId;
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

/**
 * Retrieve paused repeaters.
 *
 * @returns {*[]}
 */
function getPaused() {
  return Object.values(tracker)
    .filter((gen) => !gen.timeoutId && !gen.intervalId)
    .map((gen) => gen.name);
}

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
 * Runs the function once then sets the repeater interval.
 *
 * @param {Function} fn - the function to execute
 * @param {Object} def - the repeater definition object
 * @returns {*}
 */
function runOnceAndSetInterval(fn, def) {
  delete def.timeoutId;
  def.intervalId = setInterval(fn, def.interval);
  return fn();
} // runOnceAndSetInterval

/**
 * Start a repeater and track it in the tracker.
 *
 * @param {Object} defn - Repeater definition object with the following
 *  attributes:
 *  {String} name - required, unique name for the repeater
 *  {Number} interval - required, repeat interval in milliseconds
 *  {Function} func - required, function to execute repeatedly
 * @throws {ValidationError} - Thrown by validateDefinition
 * @returns {Object} the updated repeater definition object
 */
function create(defn) {
  // clone def object
  const { name, interval, func } = defn;
  const def = { name, interval, func };

  validateDefinition(def);
  debug('create %O', def);
  const initialRun = runOnceAndSetInterval.bind(null, def.func, def);
  def.timeoutId = setTimeout(initialRun, startOffset * MILLISECONDS_PER_SECOND);
  startOffset = (startOffset + offsetInterval) % offsetSpace;
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
 * Resumes a paused repeater, given its name
 * @param  {String} name - Name of the repeat
 */
function resume(name) {
  debug('resume %s', name);
  if (!name || !tracker[name]) {
    throw new errors.ResourceNotFoundError(`Repeater "${name}" not found`);
  }

  if (!tracker[name].intervalId && !tracker[name].timeoutId) {
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
  startOffset = ONE;
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
  startOffset = ZERO;
  debug('now tracking %O', Object.keys(tracker));
  return tracker;
} // stopAllRepeaters

/**
 * Convenience function to create a new generator repeater.
 *
 * @param {Object} generator - The sample generator object
 * @throws {ValidationError} - Thrown by validateDefinition, called by
 *  repeater.create
 * @returns {Object} the updated repeater definition object
 */
function createGeneratorRepeater(generator) {
  const genIsBulk = commonUtils.isBulk(generator);

  debug('setupRepeater (%s) for generator %O', genIsBulk ? 'bulk' : 'by subject',
    commonUtils.sanitize(generator, ['token', 'context']));

  const collFunc = genIsBulk ? collectBulk : collectBySubject;
  const handlerFunc = genIsBulk
                        ? handleCollectResponseBulk
                        : handleCollectResponseBySubject;

  const collect = collFunc.bind(null, generator);
  const handle = handlerFunc.bind(null, generator);
  const fail = handleCollectError.bind(null, generator);

  return create({
    name: generator.name,
    interval: MILLISECONDS_PER_SECOND * generator.intervalSecs,
    func: () => collect().then(handle).catch(fail),
  });
} // createGeneratorRepeater

/**
 * Convenience function to create a new heartbeat repeater.
 *
 * @param {Function} func - the function to execute
 * @param {Number} interval - the repeater interval
 * @throws {ValidationError} - Thrown by validateDefinition, called by
 *  repeater.create
 * @returns {Object} the updated repeater definition object
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
 * @param {Number} interval - the repeater interval
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
