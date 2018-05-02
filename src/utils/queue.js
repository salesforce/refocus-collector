/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/queue.js
 */
'use strict'; // eslint-disable-line strict
const debug = require('debug')('refocus-collector:queue');
const Queue = require('buffered-queue');
const qmap = {}; // private map which will contain all the queues by name
const sanitize = require('./commonUtils').sanitize;

/**
 * Create a buffered queue object using the queueParams, and add it to the
 * module-level map of buffered queue objects.
 *
 * @param  {Object} queueParams - Queue parameters, including name, size,
 *  flushTimeout, verbose, flushFunction, token and proxy (optional).
 * @returns {Object} The new buffered queue object
 */
function create(queueParams) {
  const sanitized = sanitize(queueParams, ['token']);
  debug('Create queue %O', sanitized);
  const q = new Queue(queueParams.name, {
    size: queueParams.size,
    flushTimeout: queueParams.flushTimeout,
    verbose: queueParams.verbose,
  });
  q.on('flush', (data, name) => {
    debug('%s on flush, data=%O, queueParams %O', name, data, queueParams);
    queueParams.flushFunction(queueParams.url, queueParams.token,
      queueParams.proxy, data);
  });
  qmap[queueParams.name] = q;
  debug('Created %O', q);
  return q;
} // create

/**
 * Get the buffered queue instance by its name or false if not found.
 *
 * @param {String} name - Name of the buffered queue instance
 * @returns {Object} returns the buffered queue object or false if not found
 */
function get(name) {
  const q = qmap[name];
  if (q) {
    debug('get(%s)... found %O', name, q);
    return q;
  }

  debug('get(%s)... not found');
  return false;
} // get

/**
 * Returns true if we are tracking a buffered queue instance with this name.
 *
 * @param {String} name - Name of the buffered queue instance
 * @returns {Boolean} if the named queue exists
 */
function exists(name) {
  return qmap.hasOwnProperty(name);
} // exists

/**
 * Updates the queue size for the named queue.
 *
 * @param {String} name - the name of the buffered queue
 * @param {Number} size - the new size for the named queue
 * @returns {Number} new size
 */
function updateSize(name, size) {
  if (typeof size !== 'number' || size < 1)
    throw new Error(`Invalid queue size ${size}`);
  const q = get(name);
  if (!q) throw new Error(`Queue "${name}" not found`);
  const oldSize = q._size;
  q._size = size;
  debug('Updated queue "%s" size from %d to %d', name, oldSize, q._size);
  return get(name)._size;
} // updateSize

/**
 * Updates the queue flush timeout for the named queue.
 *
 * @param {String} name - the name of the buffered queue
 * @param {Number} timeout - the new timeout for the named queue
 * @returns {Number} new timeout
 */
function updateFlushTimeout(name, timeout) {
  if (typeof timeout !== 'number' || timeout < 1)
    throw new Error(`Invalid queue flush timeout ${timeout}`);
  const q = get(name);
  if (!q) throw new Error(`Queue "${name}" not found`);
  const oldTimeout = q._flushTimeout;
  q._flushTimeout = timeout;
  debug('Updated queue "%s" flush timeout from %d to %d', name, oldTimeout,
    q._flushTimeout);
  return get(name)._flushTimeout;
} // updateSize

/**
 * Enqueues data to the buffered queue from array.
 *
 * @param  {String} name - Name of the buffered queue
 * @param  {Array} arr - Array of elements to add to the queue
 * @returns {Number} new size of queue
 * @throws {Error} if queueName not found
 */
function enqueue(name, arr) {
  const q = get(name);
  if (!q) throw new Error(`Queue "${name}" not found`);
  debug('About to enqueue %d items to queue "%s" (currently %d items)',
    arr.length, name, q.Items.length);
  arr.forEach((i) => q.add(i));
  debug('Queue "%s" now has %d items', name, q.Items.length);
  return q.Items.length;
} // enqueue

/**
 * Flushes all the buffered queues.
 */
function flushAll() {
  Object.keys(qmap).forEach((name) => qmap[name].onFlush());
} // flushAll

module.exports = {
  create,
  enqueue,
  exists,
  flushAll,
  get,
  updateFlushTimeout,
  updateSize,
};
