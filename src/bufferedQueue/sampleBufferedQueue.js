/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/bufferedQueue/sampleBufferedQueue.js
 */
const bufferedQueue = require('buffered-queue');
let sampleBufferedQueue;

function create(name, size, flshTimeout) {
  sampleBufferedQueue = new Queue(name, {
    size: size,
    flshTimeout: flshTimeout,
  });

  sampleBufferedQueue.on('flush', (data, name) => {
    console.log(data);
  });
}

module.exports = {
  create,
  sampleBufferedQueue,
};