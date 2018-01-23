/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-resume.js
 *
 * Executes the "resume" command.
 */
'use strict'; // eslint-disable-line strict
const program = require('commander');
const logger = require('winston');
const cmdUtils = require('./utils');
const doPost = require('../utils/httpUtils.js').doPostToRefocus;

program
  .option('-n, --collectorName <collectorName>', 'The name of the ' +
    'collector to be resumed')
  .option('-u, --refocusUrl <refocusUrl>', 'The url of the refocus ' +
    'instance this collector will send to')
  .option('-t, --accessToken <accessToken>', 'A valid refocus token')
  .option('-r, --refocusProxy <refocusProxy>', 'Proxy to Refocus')
  .parse(process.argv);

if (!cmdUtils.validateArgs(program)) {
  process.exit(1);
}

const config = cmdUtils.setupConfig(program);
const resumePath = `/v1/collectors/${config.name}/resume`;
logger.log('Resume =>', config.name, config.refocus.url + resumePath);

// Request to Refocus to resume collector
doPost(resumePath)
.then(() => {
  logger.info(`Request to resume collector ${config.name} has been accepted.`);
})
.catch((err) => {
  logger.error(err.message);
  logger.error(err.explanation);
  logger.error(err.response);
});
