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
 * Load the registry and set up all the command-line options.
 */

// for package commands
const program = require('commander');
const constants = require('../constants');

// for the large refocus font in command line
const figlet = require('figlet');
const setRegistryAndParseCommand = require('./utils')
  .setRegistryAndParseCommand;

program
  .version('0.0.1')
  .command('register <name> <url> <token>',
    'Register collector by name, refocus url and API token')
  .command('start <name>', 'Start given collector')
  .command('stop <name>', 'Stop given collector')
  .command('status <name>', 'Show status of collector')
  .command('deregister <name>', 'Deregister given collector');

program.on('--help', () => {
  console.log('  Examples:');
  console.log('');
  console.log('    $ refocus-collector --help');
  console.log('    $ refocus-collector register --name=test ' +
    '--url=test@test.com --token=eygduyguygijfdhkfjhkfdhg');
  console.log('    $ refocus-collector start --name=test');
  console.log('    $ refocus-collector stop --name=test');
  console.log('    $ refocus-collector status --name=test');
  console.log('    $ refocus-collector deregister --name=test');
  console.log(figlet.textSync('Refocus Collector'));
});

setRegistryAndParseCommand(program, constants.registryLocation);
