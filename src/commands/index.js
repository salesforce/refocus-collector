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
 * Set up all the command-line options.
 */
const program = require('commander');
const logger = require('winston');
const figlet = require('figlet');
const constants = require('../constants');
const conf = require('../config/config');
const pj = require('../../package.json');

program
.version(pj.version)
.command('start --collectorName <name> --refocusUrl <url> --accessToken <token>',
  'Start collector')
.command('stop --collectorName <name>', 'Stop collector')
.command('status --collectorName <name>', 'Show current status of collector')
.command('deregister --collectorName <name>', 'Deregister collector')
.command('reregister --collectorName <name> --refocusUrl <url> --accessToken <token>',
  'Reregister a collector which has been deregistered');

program.on('--help', () => {
  console.log('  Examples:\n');
  console.log('    $ refocus-collector --help');
  console.log('    $ refocus-collector start --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijfdhkfjhkfdhg');
  console.log('    $ refocus-collector stop --collectorName=test');
  console.log('    $ refocus-collector status --collectorName=test');
  console.log('    $ refocus-collector deregister --collectorName=test');
  console.log('    $ refocus-collector reregister --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijfdhkfjhkfdhg');
  console.log(figlet.textSync('Refocus Collector'));
});

try {
  conf.initializeConfig();
  program.parse(process.argv);
} catch (err) {
  logger.error(`${err.message}\n\n${err}`);
}
