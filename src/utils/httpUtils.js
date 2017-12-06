/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/utils/httpUtils.js
 */
'use strict'; // eslint-disable-line strict
const debug = require('debug')('refocus-collector:httpUtils');
const errors = require('../errors');
const request = require('superagent');
require('superagent-proxy')(request);
const bulkUpsertEndpoint = require('../constants').bulkUpsertEndpoint;
const logger = require('winston');
const configModule = require('../config/config');

/**
 * Send the upsert and handle any errors in the response.
 *
 * @param {Array} arr is the array of samples to upsert;
 * @throws {ValidationError} if argument(s) is missing,
 * or in a wrong format.
 * @returns {Promise} contains a successful response, or failed error
 */
function doBulkUpsert(arr, userToken) {
  const config = configModule.getConfig();
  const url = config.refocus.url;
  return new Promise((resolve, reject) => {
    if (!url) {
      // Throw error if url is not present in config.
      debug('Error: refocus url not found. Supplied %s', url);
      reject(new errors.ValidationError(
        'config.refocus should have a url property.'
      ));
    }

    if (!userToken) {
      // Throw error if user token not provided.
      debug('Error: refocus user  not found. Supplied %s', userToken);
      reject(new errors.ValidationError(
        'Added generators should have a token property.'
      ));
    }

    if (!Array.isArray(arr)) {
      // Throw error if no array is supplied
      debug('Error: array of samples to post not found. Supplied %s', arr);
      reject(new errors.ValidationError('bulk upsert needs an array of ' +
        'samples to send. No samples array found.'
      ));
    }

    const upsertUrl = url + bulkUpsertEndpoint;
    debug('Bulk upserting to: %s', upsertUrl);

    const req = request
                .post(upsertUrl)
                .send(arr)
                .set('Authorization', userToken)
                .set('Accept', 'application/json');

    if (config.refocus.proxy) {
      req.proxy(config.refocus.proxy); // set proxy for following request
    }

    req.end((err, res) => {
      if (err) {
        logger.error('bulkUpsert returned an error: %o', err);
        return reject(err);
      }

      debug('bulkUpsert returned an OK response: %o', res);
      return resolve(res);
    });
  });
}

module.exports = {
  doBulkUpsert,
};
