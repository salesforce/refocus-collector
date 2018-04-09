/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-stop.js
 *
 * Executes the "stop" command.
 */
const program = require('commander');
const logger = require('winston');
const cmdUtils = require('./utils');
const doPost = require('../utils/httpUtils.js').doPost;

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
const cr = config.refocus;
const url = `${cr.url}/v1/collectors/${config.name}/stop`;
logger.log('Stop =>', config.name, url);

// Request to Refocus to stop the collector
doPost(url, cr.accessToken, cr.proxy)
.then(() => logger.info(`Stopping ${config.name}`))
.catch((err) => {
  logger.error(err.message);
  logger.error(err.explanation);
  logger.error(err.response);
});
