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
const repeatTracker = {

};

/**
 * Stub for the function that pings the target data source and gets the sample
 * data back. This function will be exported from another module once that is
 * ready.
 */
function collectStub() { }

/**
 * The default function that is called every time a task is repeated.
 * @param {Object} result - The return value of one particular task
 *  invocation.
 */
function onProgress(result) {
  debug('onProgress: task was successfully repeated with' +
    `the following response: ${result}`);
} // onProgress

/**
 * The default function that is called when all the repetition is complete
 * @param {Array} results - An array of objects, where each element is the
 * return value for each invocation.
 */
function onSuccess(results) {
  debug('onSuccess: All the repeat tasks were completed with the ' +
  `the following response: ${results}`);
} // onSuccess

/**
 * The default function that is called when the task function invocation
 * throws an error.
 * @param {Object} err - Error thrown by the repeatable task.
 */
function onFailure(err) {
  logger.log('error', `onFailure: The task returned an error ${err}`);
} // onFailure

/**
 * Given an object with a name attribute or name string, it stops the repeat
 * task identified by the name and deletes it from the repeatTracker.
 * @param {Object|String} obj - An object with a name attrbute or a name string
 */
function stopRepeat(obj) {
  const name = obj.name || obj;
  repeatTracker[name].stop();
  delete repeatTracker[name];
  logger.log('info', `Stopping repeat identified by: ${obj.name}`);
} // stopRepeat

/**
 * This is a generic function to start a repeat and track the repeat in the
 * repeatTracker.
 * @param  {Object} obj - An object having a name and an interval attribute
 * @param  {Function} fnToRepeat - A task that is to be repeated
 * @param  {Function} successCb - A function that is called after all the repeat
 * task is done.
 * @param  {Function} failureCb - A function that is called if task function
 * throws an error
 * @param  {Function} progressCb - A function that is called every time a
 * repeat task is completed
 * @returns {Promise} - A read-only Promise instance
 */
function startNewRepeat(obj, fnToRepeat, // eslint-disable-line max-params
  successCb, failureCb, progressCb) {
  const repeatHandle = repeat(fnToRepeat);
  repeatHandle.every(obj.interval, 'ms').start.now();
  repeatHandle.then(successCb || onSuccess, failureCb || onFailure,
    progressCb || onProgress);
  repeatTracker[obj.name] = repeatHandle;
  const returnObj = {
    repeatHandle,
    repeatInterval: obj.interval,
    repeat: fnToRepeat,
    repeatName: obj.name,
  };
  logger.log('info', 'Started a repeat task to repeat function: ' +
   `${fnToRepeat.name}, identified by name: ${obj.name}, every ` +
   `${obj.interval} ms`);
  return returnObj;
} // startNewRepeat

/**
 * This is a generic function to update a repeat identified by name.
 * @param  {Object} obj - An object having a name and an interval attribute
 * @param  {Function} fnToRepeat - A task that is to be repeated
 * @param  {Function} successCb - A function that is called after all the repeat
 * task is done.
 * @param  {Function} failureCb - A function that is called if creating the
 * repeatable task fails
 * @param  {Function} progressCb - A function that is called every time a
 * repeat task is completed
 * @returns {Promise} - A read-only Promise instance
 */
function updateRepeat(obj, fnToRepeat, // eslint-disable-line max-params
  successCb, failureCb, progressCb) {
  stopRepeat(obj.name);
  return startNewRepeat(obj, fnToRepeat, successCb, failureCb, progressCb);
} // updateRepeat

/**
 * Function to create a new generator repeat. It calls the generic
 * startNewRepeat to start a new repeat
 * @param  {Object} obj - An object having a name and an interval attribute
 * @returns {Promise} - A read-only Promise instance
 */
function startNewGeneratorRepeat(obj) {
  return startNewRepeat(obj, collectStub);
} // startNewGeneratorRepeat

/**
 * Function to update the generator repeat.
 * @param  {Object} obj - An object having a name and an interval attribute
 * @returns {Object} - A read-only Promise instance
 */
function updateGeneratorRepeat(obj) {
  return updateRepeat(obj, collectStub);
} // updateGeneratorRepeat

module.exports = {
  stopRepeat,

  startNewRepeat,

  updateRepeat,

  startNewGeneratorRepeat,

  updateGeneratorRepeat,

  // exported for the purpose of testing
  repeatTracker,
};
