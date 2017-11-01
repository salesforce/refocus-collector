/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/utils.js
 *
 * Configuration Initialization
 */
const debug = require('debug')('refocus-collector:config');
const common = require('../utils/commonUtils');
const errors = require('../errors');
const registryFileUtils = require('../utils/registryFileUtils');
const registrySchema = require('../utils/schema').registry;
const refocusInstanceSchema = require('../utils/schema').refocusInstance;

/**
 * Validate the refocus instances.
 *
 * @throws {ValidationError} - If registry entry missing "url" or "token"
 *  attribute
 */
function validateRegistry(regObj) {
  if (!regObj) {
    throw new errors.ValidationError('No registry object');
  }

  const val = registrySchema.validate(regObj);
  if (val.error) {
    throw new errors.ValidationError(val.error.message);
  }

  for (const r in regObj.refocusInstances) {
    if (regObj.refocusInstances.hasOwnProperty(r)) {
      const res = refocusInstanceSchema.validate(regObj.refocusInstances[r]);
      if (res.error) {
        throw new errors.ValidationError(res.error.message);
      }
    }
  }
} // validateRegistry

/**
 * Initialize the config object. If the "reg" argument is an object, it is
 * assigned as the config registry. If the "reg" argument is a string, treat
 * it is a file location and try to assign the file contents as the config
 * registry.
 *
 * @param {String|Object} reg - Registry object or location of registry file
 * @returns {Object} - Config object
 * @throws {ValidationError} - If registry is invalid.
 * @throws {ResourceNotFoundError} - Thrown by common.readFileSynchr
 */
function init(reg) {
  const conf = {
    collectorConfig: {
      heartbeatInterval: 15000, // TODO remove me once it's coming from refocus
      maxSamplesPerBulkRequest: 100, // TODO remove me once it's coming from refocus
      // TODO remove me once it's coming from refocus
      sampleUpsertQueueTime: 5000, // in milliseconds
    },
    generators: {},
    registry: {},
  };

  const metadata = common.getCurrentMetadata();
  Object.assign(conf.collectorConfig, metadata);

  let r;
  if (typeof reg === 'object') {
    r = reg;
  } else if (typeof reg === 'string') {
    // Get file contents synchronously.
    debug('Reading from file %s', reg);
    let fileContents;
    try {
      fileContents = common.readFileSynchr(reg);
    } catch (err) {
      registryFileUtils.createRegistryFile(reg);
    }

    if (fileContents) {
      r = JSON.parse(fileContents);
      validateRegistry(r);
    }
  }

  conf.registry = {
    "name": "Refocus-Collector",
    "refocusInstances": {
      "sandbox": {
        "name": "sandbox",
        "url": "https://refocus-staging.internal.salesforce.com",
        "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbm5hbWUiOiJzaXRlcmVsaWFiaWxpdHlUb29sc0BzYWxlc2ZvcmNlLmNvbSIsInVzZXJuYW1lIjoic2l0ZXJlbGlhYmlsaXR5VG9vbHNAc2FsZXNmb3JjZS5jb20iLCJpYXQiOjE0ODUzMDIwOTJ9.2o_R-MyiD1gxyd6dlYnfilSmCTjJPHKsG9rs24x3Zek"
      }
    }
  };
  debug('Initialized config: %s', JSON.stringify(conf));
  return conf;
} // init

module.exports = {
  init,
  validateRegistry, // exported for testing only
};
