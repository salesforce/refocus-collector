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

/**
 * Perform a post operation on a given endpoint point with the given token and
 * the optional request body.
 *
 * @param  {String} url - The url to post to.
 * @param  {String} token - The Authorization token to use.
 * @param  {String} proxy - Optional proxy url
 * @param  {Object} body - The optional post body.
 * @returns {Promise} which resolves to the post response
 */
function doPost(url, token, proxy, body) {
  const req = request.post(url)
    .send(body || {})
    .set('Authorization', token);
  if (proxy) req.proxy(proxy);
  return req;
} // doPost

/**
 * Send the upsert and handle any errors in the response.
 *
 * @param {Array} arr is the array of samples to upsert;
 * @param {String} userToken - The authorization token to be set in the headers
 * @throws {ValidationError} if argument(s) is missing,
 * or in a wrong format.
 * @returns {Promise} contains a successful response, or failed error
 */
function doBulkUpsert(url, userToken, proxy, arr) {
  return new Promise((resolve, reject) => {
    if (!userToken) {
      // Throw error if user token not provided.
      debug('Error: refocus user not found. Supplied %s', userToken);
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

    debug('Bulk upserting %d samples to %s', arr.length, url);

    doPost(url, userToken, proxy, arr)
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
  doPost,
};
