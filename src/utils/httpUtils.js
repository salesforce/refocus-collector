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
 * Perform a post operation on a given endpoint point with the optional request
 * body
 * @param  {String} endpoint - The api endpoint to post to.
 * @param  {Object} body - The optional post body.
 * @returns {Promise} which resolves to the post response
 */
function doPostToRefocus(endpoint, body) {
  const config = configModule.getConfig();
  const refocusUrl = config.refocus.url + endpoint;
  const req = request.post(refocusUrl)
    .send(body || {})
    .set('Authorization', config.refocus.accessToken);
  if (config.refocus.proxy) {
    req.proxy(config.refocus.proxy);
  }

  return req;
}

/**
 * Send the upsert and handle any errors in the response.
 *
 * @param {Array} arr is the array of samples to upsert;
 * @param {String} userToken - The authorization token to be set in the headers
 * @throws {ValidationError} if argument(s) is missing,
 * or in a wrong format.
 * @returns {Promise} contains a successful response, or failed error
 */
function doBulkUpsert(arr, userToken) {
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

    debug('Bulk upserting to: %s', bulkUpsertEndpoint);

    doPostToRefocus(bulkUpsertEndpoint, arr)
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
  doPostToRefocus,
};
