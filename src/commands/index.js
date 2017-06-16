#!/usr/bin/env node

/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/index.js
 *
 * Main module for the refocus-collector.
 *
 * Load the registry, execute the start command,
 * and set up all the command-line options.
 */

// for package commands
const program = require('commander');
const constants = require('../constants');

// for the large refocus font in command line
const figlet = require('figlet');
const setRegistryAndParseCommand = require('./utils').setRegistryAndParseCommand;

program
  .version('0.0.1')
  .option('-n, --name', 'The name of the refocus collector')
  .option('-u, --url', 'The url of the refocus instance')
  .option('-t, --token', 'The token of the refocus instance')
  .command('register <name> <url> <token>', 'Register collector by name, refocus url and API token')
  .command('start <name>', 'Start given collector')
  .command('stop <name>', 'Stop given collector')
  .command('status <name>', 'Show status of collector')
  .command('deregister <name>', 'Deregister given collector');

program.on('--help', () => {
  console.log('  Examples:');
  console.log('');
  console.log('    $ rc --help');
  console.log('    $ rc register test test@test.com eygduyguygijfdhkfjhkfdhg');
  console.log('    $ rc start test');
  console.log('    $ rc stop test');
  console.log('    $ rc status test');
  console.log('    $ rc deregister test');
  console.log(figlet.textSync('Refocus Collector'));

});

setRegistryAndParseCommand(program, constants.registryLocation);

module.exports = {
  program,
};
