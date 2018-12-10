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
 * Configuration Settings - Exports getter and setter to get and set the
 * registry information
 */
const common = require('../utils/commonUtils');
const debug = require('debug')('refocus-collector:config');

/**
 * Config object created by loading local registry. This object is also
 * updated by the response from the hearbeat.
 * @type {Object}
 */
let config;

/**
 * Function to clear the config object.
 */
function clearConfig() {
  config = null;
} // clearConfig

/**
 * Initialize the config object.
 *
 * @returns {Object} - Config object
 */
function getDefaultConfig() {
  /**
   * Config Object
   * @type {Object}
   *
   * {
   *   // from command-line arg or env var
   *   name: "[MY_COLLECTOR_NAME]",
   *   dataSourceProxy: "[DATASOURCE_PROXY]",
   *
   *   refocus: {
   *     // from command-line arg or env var
   *     url: "[MY_REFOCUS_BASE_URL]",
   *
   *     // from POST /v1/collectors/start response
   *     collectorToken: "[TOKEN]",

   *     // optional proxy to be used for Refocus
   *     proxy: "[REFOCUS_PROXY]",
   *
   *     // from the "collectorConfig" attribute of the
   *     // POST /v1/collectors/:key/heartbeat response
   *     heartbeatIntervalMillis: [INTEGER],
   *     maxSamplesPerBulkUpsert: [INTEGER],
   *     requireSslToRemoteDataSource: [BOOLEAN],
   *
   *     // plus any other parameters returned in the "collectorConfig" attribute
   *     // of the POST /v1/collectors/:key/heartbeat response
   *   },
   *
   *   // written to the config before each heartbeat call
   *   metadata: {
   *     osInfo: {
   *       arch: os.arch(),
   *       hostname: os.hostname(),
   *       platform: os.platform(),
   *       release: os.release(),
   *       type: os.type(),
   *
   *       username: os.userInfo().username,
   *     },
   *     processInfo: {
   *       execPath: process.execPath,
   *       memoryUsage: process.memoryUsage(),
   *       uptime: process.uptime(),
   *       version: process.version,
   *       versions: process.versions,
   *     },
   *     version: require('../../package.json').version,
   *   },
   *
   *   // from the POST /v1/collectors/:key/heartbeat response
   *   generators: {
   *     "[GENERATOR_NAME]": { ... },
   *     ...
   *   },
   * }
   */

  const conf = {
    // overridden from response from Refocus
    refocus: {
      heartbeatIntervalMillis: undefined,
      maxSamplesPerBulkUpsert: undefined,
      requireSslToRemoteDataSource: false,
    },
    generators: {},
    metadata: {},
  };

  const metadata = common.getCurrentMetadata();
  Object.assign(conf.metadata, metadata);
  return conf;
} // getDefaultConfig

/**
 * Initialize the config object.
 *
 * @param {Object} reg - Registry object or location of registry file
 */
function initializeConfig() {
  config = getDefaultConfig();
  debug('Initialized config: %O', config);
} // initializeConfig

/**
 * Returns the config object
 * @returns {Object} Config Object
 */
function getConfig() {
  return config;
} // getConfig

module.exports = {
  attributesToSanitize: ['accessToken', 'collectorToken', 'token'],
  clearConfig, // exported for testing
  initializeConfig,
  getConfig,
};
