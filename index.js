/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * index.js
 *
 * Main module for the refocus-collector.
 */
'use strict'; // eslint-disable-line strict
const logger = require('winston');

logger.configure({
  transports: [
    new (logger.transports.Console)({ timestamp: true }),
  ],
});
/* Allow the commands to be run directly for testing. */
module.exports = {
  start: () => require('./src/commands/refocus-collector-start'),
  stop: () => require('./src/commands/refocus-collector-stop'),
  pause: () => require('./src/commands/refocus-collector-pause'),
  resume: () => require('./src/commands/refocus-collector-resume'),
  status: () => require('./src/commands/refocus-collector-status'),
  reregister: () => require('./src/commands/refocus-collector-reregister'),
  deregister: () => require('./src/commands/refocus-collector-deregister'),
};
