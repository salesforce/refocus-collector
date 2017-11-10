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
const program = require('commander');
const logger = require('winston');
const cmdStart = require('./start');

program
  .option('-n, --collectorName <collectorName>', 'The name of the collector to be started')
  .option('-n, --refocusUrl <refocusUrl>', 'The url of the refocus instance this collector' +
    ' will send to')
.option('-n, --accessToken <accessToken>', 'A valid refocus token')
  .parse(process.argv);

const collectorName = program.collectorName || process.env.RC_COLLECTOR_NAME;
const refocusUrl = program.refocusUrl || process.env.RC_REFOCUS_URL;
const accessToken = program.accessToken || process.env.RC_ACCESS_TOKEN;

if (!collectorName) {
  logger.error('You must specify a collector name');
  process.exit(1);
} else if (!refocusUrl) {
  logger.error('You must specify the url of the refocus instance');
  process.exit(1);
} else if (!accessToken) {
  logger.error('You must specify an access token');
  process.exit(1);
}

console.log('Start =>', collectorName, refocusUrl, accessToken);
cmdStart.execute(collectorName, refocusUrl, accessToken)
.catch((err) => {
  logger.error(err.message);
  logger.error(err.explanation);
  logger.error(err.response);
});
