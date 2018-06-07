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
const attachSubjectsToGeneratorEndpoint = require('../constants').attachSubjectsToGeneratorEndpoint;
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
function doPost(url, token, proxy, body, intervalSecs = Infinity) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    makeRequestWithRetry(makeRequest, resolve, reject);

    function makeRequest() {
      const timeSpent = Date.now() - start;

      if (timeSpent >= intervalSecs) {
        debug('doBulkUpsert request dropped after %d milliseconds', timeSpent);
        logger.info({
          activity: 'abandonBulkUpsert',
          timeSpent: timeSpent,
        });
        return new Promise((resolve, reject) => {
          reject(`doBulkUpsert request dropped after ${timeSpent} milliseconds`);
        });
      }

      const req = request.post(url)
        .send(body || {})
        .set('Authorization', token);
      if (proxy) req.proxy(proxy);
      return req;
    }
  });
} // doPost

/**
 * Retry api requests on 429 errors
 *
 * @param  {Function} makeRequest - The request to attempt
 * @param  {Function} resolve - The resolve function from the calling Promise
 * @param  {Function} reject - The reject function from the calling Promise
 * @returns {Promise} which contains successful response or failed error
 */
function makeRequestWithRetry(makeRequest, resolve, reject) {
  return makeRequest().then(res => resolve(res), err => {
    // console.log('status: ', err.status)
    if (err.status === 429) {
      const waitTime = err.response.headers['retry-after'] * 1000; //convert to milliseconds
      setTimeout(() => makeRequestWithRetry(makeRequest, resolve, reject), waitTime);
    } else {
      reject(err);
    }
  });
}

/**
 * Send the upsert and handle any errors in the response.
 *
 * @param {String} url - The url to post to.
 * @param {String} userToken - The authorization token to be set in the headers
 * @param {Number} intervalSecs - time until generator has new data available
 * @param {String} proxy - Optional proxy url
 * @param {Array} arr is the array of samples to upsert;
 * @throws {ValidationError} if argument(s) is missing, or in a wrong format.
 * @returns {Promise} contains a successful response, or failed error
 */
function doBulkUpsert(url, userToken, intervalSecs, proxy, arr) {
  if (!userToken) {
    const e = new ValidationError('doBulkUpsert missing token');
    logger.error(e.message);
    /*
     * Don't Promise.reject(...) this error, because there is no handler for
     * the rejection.
     */
    return Promise.resolve(e);
  }

  if (!Array.isArray(arr)) {
    const e = new ValidationError('doBulkUpsert missing array of samples');
    logger.error(e.message);
    /*
     * Don't Promise.reject(...) this error, because there is no handler for
     * the rejection.
     */
    return Promise.resolve(e);
  }

  // Don't bother sending a POST if the array is empty.
  if (arr.length === 0) return Promise.resolve(true);

  url += bulkUpsertEndpoint;
  return new Promise((resolve, reject) => {
    debug('Bulk upserting %d samples to %s', arr.length, url);
    doPost(url, userToken, proxy, arr, intervalSecs)
    .then(res => {
      debug('doBulkUpsert returned OK %O', res.body);
      logger.info({
        activity: 'bulkUpsert',
        numSamples: arr.length,
      });
      return resolve(res);
    },

    err => {
      debug('doBulkUpsert err %O', err);
      logger.error(err.message);
      /*
       * Don't Promise.reject(...) this error, because there is no handler
       * for the rejection.
       */
      return resolve(err);
    });
  });
} // doBulkUpsert

/**
 * Find Refocus subjects using query parameters.
 *
 * @param {Object} generator - Generator object from the heartbeat. Contains:
 *  {String} url - The Refocus url.
 *  {String} token - The Authorization token to use.
 *  {String} proxy - Optional proxy url
 *  {String} qry - the query string
 * @throws {ValidationError} if argument(s) is missing
 * @returns {Promise} array of subjects matching the query
 */
function attachSubjectsToGenerator(generator) {
  const url = generator.refocus.url;
  const token = generator.token;
  const proxy = generator.refocus.proxy;
  const qry = generator.subjectQuery;

  debug('attachSubjectsToGenerator(url=%s, token=%s, proxy=%s, qry=%s)', url,
    token ? 'HAS_TOKEN' : 'MISSING', proxy, qry);
  if (!url) {
    const e = new ValidationError('Missing refocus url');
    logger.error('attachSubjectsToGenerator', e.message);
    return Promise.reject(e);
  }

  if (!qry) {
    const e = new ValidationError('Missing subject query');
    logger.error('attachSubjectsToGenerator', e.message);
    return Promise.reject(e);
  }

  if (!token) {
    const e = new ValidationError('Missing token');
    logger.error('attachSubjectsToGenerator', e.message);
    return Promise.reject(e);
  }

  return new Promise((resolve, reject) => {
    makeRequestWithRetry(makeRequest, resolve, reject);

    function makeRequest() {
      const req = request.get(url + attachSubjectsToGeneratorEndpoint)
        .query(qry.startsWith('?') ? qry.slice(1) : qry)
        .set('Authorization', token);
      if (proxy) req.proxy(proxy);
      return req.then((res) => {
        debug('attachSubjectsToGenerator returning %O', res.body);
        generator.subjects = res.body || [];
        return generator;
      });
    }
  });
} // attachSubjectsToGenerator

module.exports = {
  doBulkUpsert,
  doPost,
  attachSubjectsToGenerator,
};
