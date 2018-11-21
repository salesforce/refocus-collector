/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-restart.js
 *
 * Executes the "stop" command and then "start" command.
 */
const program = require('commander');
const logger = require('winston');
const cmdUtils = require('./utils');
const cmdStart = require('./start');
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
const stopUrl = `${cr.url}/v1/collectors/${config.name}/stop`;

// Request to Refocus to stop the collector and start the collector
module.exports =
  doPost(stopUrl, cr.accessToken, cr.proxy)
  .then(() => logger.info(`Stopping ${config.name}`))
  .then(() => cmdStart.execute())
  .then(() => logger.info(`Starting ${config.name}`))
  .catch((err) => {
    /* When stopping a brand new collector, error is thrown because it is not
    found in refocus. We catch the error and just start the collector */
    if (err.message === 'Not Found') {
      return cmdStart.execute()
      .then(() => logger.info(`Starting ${config.name}`));
    }

    logger.error(err.message, err.explanation, err.response);
  })
  .catch((err) => {
    logger.error(err.message, err.explanation, err.response);
  });

