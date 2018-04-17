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
const ValidationError = require('../errors').ValidationError;
const request = require('superagent');
require('superagent-proxy')(request);
const bulkUpsertEndpoint = require('../constants').bulkUpsertEndpoint;
const findSubjectsEndpoint = require('../constants').findSubjectsEndpoint;
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
  if (!userToken) {
    const e = new ValidationError('doBulkUpsert missing token');
    logger.error(e.message);
    return Promise.reject(e);
  }

  if (!Array.isArray(arr)) {
    const e = new ValidationError('doBulkUpsert missing array of samples');
    logger.error(e.message);
    return Promise.reject(e);
  }

  // Don't bother sending a POST if the array is empty.
  if (arr.length === 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    debug('Bulk upserting %d samples to %s', arr.length, url);
    doPost(url, userToken, proxy, arr)
    .end((err, res) => {
      if (err) {
        logger.error(err.message);
        return reject(err);
      }

      debug('doBulkUpsert returned an OK response: %O', res.body);
      return resolve(res);
    });
  });
} //  doBulkUpsert

/**
 * Find Refocus subjects using query parameters.
 *
 * @param  {String} url - The Refocus url.
 * @param  {String} token - The Authorization token to use.
 * @param  {String} proxy - Optional proxy url
 * @param {String} qry - the query string
 * @returns {Promise} array of subjects matching the query
 */
function findSubjects(url, token, proxy, qry) {
  debug('findSubjects(url=%s, token=%s, proxy=%s, qry=%s)', url,
    token ? 'HAS_TOKEN' : 'MISSING', proxy, qry);
  if (!url) {
    const e = new ValidationError('Missing refocus url');
    logger.error('findSubjects', e.message);
    return Promise.reject(e);
  }

  if (!qry) {
    const e = new ValidationError('Missing subject query');
    logger.error('findSubjects', e.message);
    return Promise.reject(e);
  }

  if (!token) {
    const e = new ValidationError('Missing token');
    logger.error('findSubjects', e.message);
    return Promise.reject(e);
  }

  const req = request.get(url + findSubjectsEndpoint)
    .query(qry.startsWith('?') ? qry.slice(1) : qry)
    .set('Authorization', token);
  if (proxy) req.proxy(proxy);
  return req.then((res) => {
    debug('findSubjects returning %O', res.body);
    return res;
  });
} // getSubjects

module.exports = {
  doBulkUpsert,
  doPost,
  findSubjects,
};
