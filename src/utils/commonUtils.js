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
const fs = require('fs');
const util = require('util');
const errors = require('../errors');
const debug = require('debug')('refocus-collector:commonUtils');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

module.exports = {

  /**
   * Read a file asynchronously.
   *
   * @param {String} fileLoc - File location relative to root folder i.e.
   *  refocus-collector folder
   * @param {string} encoding - Encoding type
   * @returns {Promise} - If success, resolves with file data, else rejects
   *  with error
   * @throws {ResourceNotFoundError} - If specified file not found.
   */
  readFileAsynchr(fileLoc, encoding) {
    debug('Reading file: %s', path.resolve(fileLoc));
    return new Promise((resolve, reject) => {
      fs.readFile(fileLoc, encoding, (err, data) => {
        if (err) {
          if (err.code === 'ENOENT') {
            reject(new errors.ResourceNotFoundError(
              util.format('File: %s not found', fileLoc
            )));
          }

          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  },

  /**
   * Read a file synchronously.
   *
   * @param {String} fileLoc - File location relative to root folder i.e.
   *  refocus-collector folder.
   * @returns {String} - File contents
   * @throws {ResourceNotFoundError} - If specified file not found.
   */
  readFileSynchr(fileLoc) {
    debug('Reading file: %s', path.resolve(fileLoc));
    let fileContents;
    try {
      fileContents = fs.readFileSync(fileLoc).toString();
    } catch (err) {
      if (err.code === 'ENOENT') {
        throw new errors.ResourceNotFoundError(
          util.format('File: %s not found', fileLoc)
        );
      } else {
        throw err;
      }
    }

    return fileContents;
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

};
