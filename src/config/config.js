/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/config.js
 *
 * Configuration Settings - Exports in-memory config object
 */
const debug = require('debug')('refocus-collector:config');
const constants = require('../constants');
const init = require('./utils').init;

/**
 * Config object created by loading local registry
 * @type {Object}
 */
const config = init(constants.localRegistryLocation);
debug('Initialized config: %s', JSON.stringify(config));
module.exports = config;
