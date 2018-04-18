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
'use strict'; // eslint-disable-line strict
const program = require('commander');
const logger = require('winston');
const figlet = require('figlet');
const pj = require('../../package.json');

program
.version(pj.version)
.command('deregister --collectorName <name>', 'Deregister collector')
.command('pause --collectorName <name> --refocusUrl <url> ' +
  '--accessToken <token>', 'Pause collector')
.command('reregister --collectorName <name> --refocusUrl <url> ' +
  '--accessToken <token>', 'Reregister a collector which has been deregistered')
.command('resume --collectorName <name> --refocusUrl <url> ' +
  '--accessToken <token>', 'Resume collector')
.command('start --collectorName <name> --refocusUrl <url> ' +
  '--accessToken <token>', 'Start collector')
.command('status --collectorName <name> --refocusUrl <url> ' +
  '--accessToken <token>', 'Get the current status of the collector')
.command('stop --collectorName <name> --refocusUrl <url> ' +
  '--accessToken <token>', 'Stop collector');

program.on('--help', () => {
  console.log('  Examples:\n');
  console.log('    $ refocus-collector --help');
  console.log('    $ refocus-collector deregister --collectorName=test');
  console.log('    $ refocus-collector pause --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijf');
  console.log('    $ refocus-collector reregister --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijf');
  console.log('    $ refocus-collector resume --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijf');
  console.log('    $ refocus-collector start --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijf');
  console.log('    $ refocus-collector status --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijf');
  console.log('    $ refocus-collector stop --collectorName=test ' +
    '--refocusUrl=https://refocus.abczyx.com --accessToken=eygduyguygijf');
  console.log(figlet.textSync('Refocus Collector'));
});

try {
  program.parse(process.argv);
} catch (err) {
  logger.error(err.message);
}
