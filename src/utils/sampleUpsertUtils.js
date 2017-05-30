/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * utils/sampleUpsertUtils.js
 */
const debug = require('debug')('refocus-collector:utils');
const errors = require('../errors/errors');
const request = require('superagent');

module.exports = {
  /**
   * Send the upsert and handle any errors in the response.
   *
   * @param {Object} registry contains Refocus url and token,
   * @param {Array} arr is the array of samples to upsert;
   * @returns {Promise} contains a successful response, or failed error
   */
  doBulkUpsert(registry, arr) {
    const { url, token } = registry;
    return new Promise((resolve, reject) => {
      if (!url) {

        // Throw error if url is not present in registry.
        debug('Error: refocus url not found. Supplied %s', url);
        reject(new errors.ValidationError(
          'registry should have url property.'
        ));
      }

      if (!arr) {

        // Throw error if no array is supplied
        debug('Error: array of samples to post not found. Supplied %s', url);
        reject(new errors.ValidationError(
          'bulk upsert needs an array of samples to send. No samples array found.'
        ));
      }

      debug('Bulk upserting to: %s', url);
      request
      .post(url)
      .send(arr)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (err) {
          reject(err);
        }

        resolve(res);
      });
    });
  },
};
