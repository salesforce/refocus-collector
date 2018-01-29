/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-pause.js
 *
 * Executes the "pause" command.
 */
'use strict'; // eslint-disable-line strict
const program = require('commander');
const logger = require('winston');
const cmdUtils = require('./utils');
const doPost = require('../utils/httpUtils.js').doPostToRefocus;

program
  .option('-n, --collectorName <collectorName>', 'The name of the ' +
    'collector to be paused')
  .option('-u, --refocusUrl <refocusUrl>', 'The url of the refocus ' +
    'instance this collector will send to')
  .option('-t, --accessToken <accessToken>', 'A valid refocus token')
  .option('-r, --refocusProxy <refocusProxy>', 'Proxy to Refocus')
  .parse(process.argv);

if (!cmdUtils.validateArgs(program)) {
  process.exit(1);
}

const config = cmdUtils.setupConfig(program);
const pausePath = `/v1/collectors/${config.name}/pause`;

logger.log('Pause =>', config.name, config.refocus.url + pausePath);

// Request to Refocus to pause the collector
doPost(pausePath)
.then(() => {
  logger.info(`Pausing ${config.name}. Use the command "refocus-collector `+
    `resume" or the /v1/collectors/${config.name}/resume endpoint to resume ` +
    'the collector');
})
.catch((err) => {
  logger.error(err.message);
  logger.error(err.explanation);
  logger.error(err.response);
});
