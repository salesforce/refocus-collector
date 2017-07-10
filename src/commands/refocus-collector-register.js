/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/refocus-collector-register.js
 *
 * Calls the "register" command.
 */
const program = require('commander');
const logger = require('winston');
const cmdStart = require('./register');

program
  .option('-n, --name <name>', 'The name of the refocus collector')
  .option('-u, --url <url>', 'The url of the refocus instance')
  .option('-t, --token <token>', 'The token of the refocus instance')
  .parse(process.argv);

const name = program.name;
const url = program.url;
const token = program.token;

if (!name || typeof (name) === 'function') {
  logger.error('There is no name of collector specified.');
  process.exit(1);
}

if (!url || typeof (url) === 'function') {
  logger.error('There is no url for collector specified.');
  process.exit(1);
}

if (!token || typeof (token) === 'function') {
  logger.error('There is no token for collector specified.');
  process.exit(1);
}

try {
  console.log('Register =>', name, url, token);
  cmdStart.execute(name, url, token);
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}
