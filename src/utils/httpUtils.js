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
const proxy = 'http://public0-proxy1-0-prd.data.sfdc.net:8080';

/**
 * Send the upsert and handle any errors in the response.
 *
 * @param {Object} refocusInstance contains Refocus url and token,
 * @param {Array} arr is the array of samples to upsert;
 * @throws {ValidationError} if argument(s) is missing,
 * or in a wrong format.
 * @returns {Promise} contains a successful response, or failed error
 */
function doBulkUpsert(refocusInstance, arr) {
  const { url, token } = refocusInstance;
  return new Promise((resolve, reject) => {
    if (!url) {
      // Throw error if url is not present in registry.
      debug('Error: refocus url not found. Supplied %s', url);
      reject(new errors.ValidationError(
        'Refocus instance should have a url property.'
      ));
    }

    if (!token) {
      // Throw error if token is not present in registry.
      debug('Error: refocus url not found. Supplied %s', token);
      reject(new errors.ValidationError(
        'Refocus instance should have a token property.'
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

    request
    .post(upsertUrl)
    .proxy(proxy)
    .send(arr)
    .set('Authorization', token)
    .set('Accept', 'application/json')
    .end((err, res) => {
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
