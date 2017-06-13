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

// for the large refocus font in command line
const figlet = require('figlet');

program
  .version('0.0.1')
  .command('register <name> <url> <token>', 'Register collector by name, refocus url and API token')
  .command('start <name>', 'Start given collector')
  .command('stop <name>', 'Stop given collector')
  .command('status <name>', 'Show status of collector')
  .command('deregister <name>', 'Deregister given collector')

program.on('--help', function() {
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

program.parse(process.argv);

module.exports = {
  program
};