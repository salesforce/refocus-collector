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
const program = require('./index').program;
const args = program.args;

console.log('Stop =>', args[0]);
