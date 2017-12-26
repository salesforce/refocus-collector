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
 * Calls the "stop" command.
 */
const program = require('commander');
const logger = require('winston');

program
  .option('-n, --collectorName <name>',
    'Specify a name for the Refocus instance you are stopping (required)')
  .option('-r, --refocusProxy <refocusProxy>', 'Proxy to Refocus')
  .parse(process.argv);

const name = program.collectorName;

if (!name || typeof (name) === 'function') {
  logger.error('You must specify a name ' +
    'for the Refocus instance you are stopping.');
  process.exit(1);
}

try {
  console.log('Stop =>', name);
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}
