/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-reregister.js
 *
 * Calls the "reregister" command.
 */
const program = require('commander');
const logger = require('winston');
const request = require('superagent');
require('superagent-proxy')(request);

program
  .option('-n, --collectorName <collectorName>', 'The name of the collector to be started')
  .option('-u, --refocusUrl <refocusUrl>', 'The url of the refocus instance this collector' +
    ' will send to')
  .option('-t, --accessToken <accessToken>', 'A valid refocus token')
  .option('-r, --refocusProxy <refocusProxy>', 'Proxy to Refocus')
  .parse(process.argv);

const collectorName = program.collectorName || process.env.RC_COLLECTOR_NAME;
const refocusUrl = program.refocusUrl || process.env.RC_REFOCUS_URL;
const accessToken = program.accessToken || process.env.RC_ACCESS_TOKEN;

// refocusProxy is an optional arg
const refocusProxy = program.refocusProxy || process.env.RC_REFOCUS_PROXY;

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

console.log('Reregister =>', collectorName, refocusUrl, accessToken);
const path = `/v1/collectors/${collectorName}/reregister`;
const url = refocusUrl + path;

// Request to Refocus to re-register collector
const req = request.post(url)
  .set('Authorization', accessToken);

if (refocusProxy) {
  req.proxy(refocusProxy); // set proxy for following request
}

req.then(() => {
  logger.info(`Collector ${collectorName} has been reregistered.`);
})
.catch((err) => {
  logger.error(err.message);
  logger.error(err.explanation);
  logger.error(err.response);
});
