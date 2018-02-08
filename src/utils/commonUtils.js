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
const debug = require('debug')('refocus-collector:commonUtils');

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
      version: require('../../package.json').version,
    };
  },

  /**
   * Get metadata properties that have been changed
   * @param  {Object} existing - the existing collectorConfig object
   * @param  {Object} current - the current metadata object
   * @returns {Object} changed - an object containing only keys that
   * are different between the existing and current objects
   */
  getChangedMetadata(existing, current) {
    const changed = {};

    Object.keys(current.osInfo).forEach((key) => {
      const existingValue = existing.osInfo[key];
      const currentValue = current.osInfo[key];
      if (existingValue !== currentValue) {
        if (!changed.osInfo) changed.osInfo = {};
        changed.osInfo[key] = currentValue;
      }
    });

    Object.keys(current.processInfo).forEach((key) => {
      const existingValue = existing.processInfo[key];
      const currentValue = current.processInfo[key];
      if (existingValue instanceof Object && currentValue instanceof Object) {
        Object.keys(currentValue).forEach((key2) => {
          if (existingValue[key2] !== currentValue[key2]) {
            if (!changed.processInfo) changed.processInfo = {};
            if (!changed.processInfo[key]) changed.processInfo[key] = {};
            changed.processInfo[key][key2] = currentValue[key2];
          }
        });
      } else if (existingValue !== currentValue) {
        if (!changed.processInfo) changed.processInfo = {};
        changed.processInfo[key] = currentValue;
      }
    });

    if (existing.version !== current.version) {
      changed.version = current.version;
    }

    return changed;
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
   * Return a copy of the object with the keys masked
   * @param  {Object} object - Object to be masked
   * @param  {Array} keys - The keys of the object to be masked
   * @returns {Object} - returns the object with the keys masked
   */
  sanitize(object, keys) {
    if (!Array.isArray(keys)) {
      return object;
    }

    const sanitized = JSON.parse(JSON.stringify(object));
    keys.forEach((key) => {
      if (object[key]) {
        sanitized[key] = '...' + sanitized[key].slice(-5);
      }
    });

    return sanitized;
  }, // sanitize

  /**
   * Determine if the given Generator is set up for bulk collection
   * @param  {Object} generator - A Generator object
   * @returns {Boolean}
   */
  isBulk(generator) {
    const gt = generator.generatorTemplate;
    const connection = gt && gt.connection;
    const bulk = connection && connection.bulk;
    return Boolean(bulk);
  }, // encrypt

  /**
   * Assign any default values from the template into the generator context if
   * no value was already provided in the generator context.
   *
   * @param {Object} ctx - The context from the generator
   * @param {Object} def - The contextDefinition from the generator template
   * @param {Object} collectorToken - The token for this collector
   * @param {Object} res - The heartbeat response object
   * @returns {Object} the context object with default values populated
   */
  assignContext(ctx, def, collectorToken, res) {
    if (!ctx) ctx = {};
    if (!def) def = {};
    const secret = collectorToken + res.timestamp;
    Object.keys(def).forEach((key) => {
      if (!ctx.hasOwnProperty(key) && def[key].hasOwnProperty('default')) {
        ctx[key] = def[key].default;
      }

      if (ctx.hasOwnProperty(key) && def.hasOwnProperty(key) &&
        def[key].encrypted) {
        ctx[key] = this.decrypt(ctx[key], secret,
          res.encryptionAlgorithm);
      }
    });

    debug('assignContext returning', ctx);
    return ctx;
  }, // assignContext
};
