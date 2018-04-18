/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-start.js
 *
 * Calls the "start" command.
 */
'use strict'; // eslint-disable-line strict
const program = require('commander');
const logger = require('winston');
const cmdStart = require('./start');
const cmdUtils = require('./utils');

program
  .option('-n, --collectorName <collectorName>', 'The name of the ' +
    'collector to be started')
  .option('-u, --refocusUrl <refocusUrl>', 'The url of the refocus ' +
    'instance this collector will send to')
  .option('-t, --accessToken <accessToken>', 'A valid refocus token')
  .option('-r, --refocusProxy <refocusProxy>', 'Proxy to Refocus')
  .option('-d, --dataSourceProxy <dataSourceProxy>', 'Proxy to data source')
  .parse(process.argv);

if (!cmdUtils.validateArgs(program)) {
  process.exit(1);
}

const config = cmdUtils.setupConfig(program);

logger.log('Start =>', config.collectorName, config.refocus.url);
cmdStart.execute()
.catch((err) => {
  logger.error(err.message, err.explanation, err.response);
});
