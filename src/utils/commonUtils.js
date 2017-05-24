/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/utils/commonUtils.js
 * Common utilities.
 */

const fs = require('fs');
const util = require('util');
const errors = require('../errors/errors');
const debug = require('debug')('refocus-collector:commonUtils');
const path = require('path');

module.exports = {
  /**
   * Read a file asynchronously.
   * @param  {String} fileLoc - File location relative to root folder i.e.
   * refocus-collector folder
   * @param  {string} encoding - Encoding type
   * @return {Promise} - If success, resolves with file data, else rejects
   * with error
   */
  readFileAsynchr(fileLoc, encoding) {
    debug('Reading file: %s', path.resolve(fileLoc));
    return new Promise((resolve, reject) => {
      fs.readFile(fileLoc, encoding, function (err, data) {
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
   * Read file synchronously.
   * @param  {String} fileLoc - File location relative to root folder i.e.
   * refocus-collector folder.
   * @return {String} - File contents
   */
  readFileSynchr(fileLoc) {
    debug('Reading file: %s', path.resolve(fileLoc));
    var fileContents;
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
};
