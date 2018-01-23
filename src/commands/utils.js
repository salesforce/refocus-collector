/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/commands/utils.js
 */
'use strict'; // eslint-disable-line strict
const configModule = require('../config/config');
const logger = require('winston');

/**
 * Validates the input arguments of the command.
 * @param  {Object} args - Input arguments
 * @returns {boolean} returns true when the input arguments are valid.
 */
function validateArgs(args) {
  const collectorName = args.collectorName || process.env.RC_COLLECTOR_NAME;
  const refocusUrl = args.refocusUrl || process.env.RC_REFOCUS_URL;
  const accessToken = args.accessToken || process.env.RC_ACCESS_TOKEN;
  if (!collectorName) {
    logger.error('You must specify a collector name.');
    return false;
  } else if (!refocusUrl) {
    logger.error('You must specify the url of the refocus instance.');
    return false;
  } else if (!accessToken) {
    logger.error('You must specify an access token.');
    return false;
  }

  return true;
} // validateArgs

/**
 * Sets up the collector config object with the validated input argumentes from
 * the command
 * @param  {Object} args - Validated input arguments
 * @returns {Object} the collector config
 */
function setupConfig(args) {
  const collectorName = args.collectorName || process.env.RC_COLLECTOR_NAME;
  const refocusUrl = args.refocusUrl || process.env.RC_REFOCUS_URL;
  const accessToken = args.accessToken || process.env.RC_ACCESS_TOKEN;

  configModule.initializeConfig();
  const config = configModule.getConfig();
  config.name = collectorName;
  config.refocus.url = refocusUrl;
  config.refocus.accessToken = accessToken;

  const refocusProxy = args.refocusProxy || process.env.RC_REFOCUS_PROXY;
  const dataSourceProxy = args.dataSourceProxy ||
    process.env.RC_DATA_SOURCE_PROXY;

  if (dataSourceProxy) {
    config.dataSourceProxy = dataSourceProxy;
  }

  if (refocusProxy) {
    config.refocus.proxy = refocusProxy;
  }

  return config;
} // setupConfig

module.exports = {
  validateArgs,
  setupConfig,
};
