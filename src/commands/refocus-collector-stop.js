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
const cmdStart = require('./stop');

program
  .option('-f, --force', 'Stop the collector without flushing the samples')
  .parse(process.argv);

cmdStart.execute(program.force)
.catch((err) => {
  logger.error(err.message);
  logger.error(err.explanation);
  logger.error(err.response);
});

