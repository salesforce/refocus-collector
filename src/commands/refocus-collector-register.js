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
const cmdRegister = require('./register');

program
  .option('-n, --name <name>',
    'Specify a name for the Refocus instance you are registering (required)')
  .option('-u, --url <url>',
    'The url of the Refocus instance you are registering (required)')
  .option('-t, --token <token>',
    'A valid API token for the Refocus instance ' +
    'you are registering (required)')
  .parse(process.argv);

const name = program.name;
const url = program.url;
const token = program.token;

if (!name || typeof (name) === 'function') {
  logger.error('You must specify a name ' +
    'for the Refocus instance you are registering.');
  process.exit(1);
}

if (!url || typeof (url) === 'function') {
  logger.error('You must specify the url of the ' +
    'Refocus instance you are registering.');
  process.exit(1);
}

if (!token || typeof (token) === 'function') {
  logger.error('You must specify a valid API token ' +
    'for the Refocus instance you are registering.');
  process.exit(1);
}

try {
  console.log('Register =>', name, url, token);
  cmdRegister.execute(name, url, token);
} catch (err) {
  logger.error(err.message);
  logger.error(err);
}
