/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/commonUtils.js
 * Common utilities.
 */
'use strict'; // eslint-disable-line strict
const errors = require('../errors');
const os = require('os');
const crypto = require('crypto');
const RefocusCollectorEval = require('@salesforce/refocus-collector-eval');
const sampleSchema = RefocusCollectorEval.sampleSchema;
const collectorVersion = require('../../package.json').version;
module.exports = {

  /**
   * Validates the sample.
   *
   * @param {Object} sample - The sample to validate
   * @returns {Object} the valid sample
   * @throws {ValidationError} if the object does not look like a sample
   */
  validateSample(sample) {
    const val = sampleSchema.validate(sample);
    if (val.error) {
      throw new errors.ValidationError(val.error.message);
    }

    return sample;
  },

  /**
   * Get current os and process metadata
   * @returns {Object} - metadata object
   */
  getCurrentMetadata() {
    return {
      osInfo: {
        arch: os.arch(),
        hostname: os.hostname(),
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        username: os.userInfo().username,
      },
      processInfo: {
        execPath: process.execPath,
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        version: process.version,
        versions: process.versions,
      },
      version: collectorVersion,
    };
  },

  /**
   * Decrypt encrypted data using passed in secretKey and algorithm
   * @param  {String} data -  Data to be decrypted
   * @param  {String} secretKey - Secret key that was used from encryption
   * @param  {String} algorithm - Name of the encryption algorithm
   * @returns {String} - encrypted data
   */
  decrypt(data, secretKey, algorithm) {
    const decipher = crypto.createDecipher(algorithm, secretKey);
    let decrypted = decipher.update(data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  }, // decrypt

  /**
   * Encrypt the given data using passed in secretKey and algorithm
   * @param  {String} data -  Data to be encrypted
   * @param  {String} secretKey - Secret key for encryption
   * @param  {String} algorithm - Name of the encryption algorithm
   * @returns {String} - encrypted data
   */
  encrypt(data, secretKey, algorithm) {
    const cipher = crypto.createCipher(algorithm, secretKey);
    let crypted = cipher.update(data, 'utf-8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  }, // encrypt

  /**
   * Return a copy of the object with the specified keys masked.
   *
   * @param  {Object} object - Object to be masked
   * @param  {Array} keys - The keys of the object to be masked, defaults to
   *  ["token"] if none provided
   * @returns {Object} - returns the object with the keys masked
   */
  sanitize(object, keys = ['token']) {
    if (!Array.isArray(keys)) {
      return object;
    }

    function doTraverse(obj, keysToSanitize, sanitizeAll=false) {
      if (obj) {
        Object.entries(obj).forEach(([key, val]) => {
          const doSanitize = keysToSanitize.includes(key) || sanitizeAll;
          if (typeof val === 'string' && doSanitize) {
            obj[key] = '...' + val.slice(-5);
          } else if (typeof val === 'object' && !Array.isArray(val)) {
            if (doSanitize) {
              doTraverse(val, [], true);
            } else {
              doTraverse(val, keysToSanitize);
            }
          }
        });
      }

      return obj;
    }

    let sanitized = JSON.parse(JSON.stringify(object)); // copy
    sanitized = doTraverse(sanitized, keys);
    return sanitized;
  }, // sanitize

  /**
   * Determine if the given Generator is set up for bulk collection
   * @param  {Object} generator - A Generator object
   * @returns {Boolean}
   */
  isBulk(generator) {
    if (!generator) return false;
    if (!generator.generatorTemplate) return false;
    if (!generator.generatorTemplate.connection) return false;
    return generator.generatorTemplate.connection.bulk || false;
  }, // isBulk
};
