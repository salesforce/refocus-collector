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
  .option('-n, --name <name>',
    'Specify a name for the Refocus instance you are starting (required)')
  .parse(process.argv);

const name = program.name;

if (!name || typeof (name) === 'function') {
  logger.error('You must specify a name ' +
    'for the Refocus instance you are starting.');
  process.exit(1);
}

try {
  console.log('Start =>', name);
  cmdStart.execute(name);
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}
