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
const config = require('../config/config');
const logger = require('winston');
const TOO_MANY_REQUESTS = 429;
const MILLIS_PER_SEC = 1000;
const IS_PUBLISHED_TRUE = 'isPublished=true';
const IS_PUBLISHED_FALSE = 'isPublished=false';

/**
 * Perform a post operation on a given endpoint point with the given token and
 * the optional request body.
 *
 * @param  {String} url - The url to post to.
 * @param  {String} token - The Authorization token to use.
 * @param  {String} proxy - Optional proxy url
 * @param  {Object} body - The optional post body.
 * @param  {Number} cutoff - Time (in milliseconds) to wait until we abandon the post request
 * @returns {Promise} which resolves to the post response
 */
function doPost(url, token, proxy, body, cutoff = Infinity) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    makeRequestWithRetry({
      makeRequest,
      resolve,
      reject,
      numAttempts: 1,
      start,
      cutoff,
    });

    function makeRequest() {
      const req = request.post(url)
        .send(body || {})
        .set('Authorization', token)
        .set('collector-name', config.getConfig().name);
      if (proxy) {
        req.proxy(proxy);
      }

      return req;
    }
  });
} // doPost

/**
 * Retry api requests on 429 errors
 *
 * @param  {Object} reqInfo - object that has parameters for the request:
 *  {Function} makeRequest - The request to attempt
 *  {Function} resolve - The resolve function from the calling Promise
 *  {Function} reject - The reject function from the calling Promise
 *  {Number} numAttempts - Number of times this request has been attempted
 *  {Number} start - timestamp for when request began
 *  {Number} cutoff - time in milliseconds that we retry the request before dropping it
 * @returns {Promise} which contains successful response or failed error
 */
function makeRequestWithRetry(reqInfo) {
  const { makeRequest, resolve, reject, numAttempts, start, cutoff } = reqInfo;
  const timeSpent = Date.now() - start;

  if (timeSpent >= cutoff) {
    debug(`Request dropped after ${timeSpent} milliseconds`);
    logger.info({
      activity: 'dropRequest',
      timeSpent,
      cutoff,
    });
    reject(`Request dropped after ${timeSpent} milliseconds`);
  }

  return makeRequest().then((res) => resolve(res), (err) => {
    if (err.status === TOO_MANY_REQUESTS) {
      // Retry with backoff. Convert waitTime to milliseconds
      const waitTime = (err.response.headers['retry-after'] + 1) *
        numAttempts * MILLIS_PER_SEC;
      debug(`Attempt #${numAttempts} was a 429. Retrying in ${waitTime} ` +
        'milliseconds...');

      // debug(err.response.error.path);
      reqInfo.numAttempts = numAttempts + 1;
      setTimeout(() => makeRequestWithRetry(reqInfo), waitTime);
    } else {
      // debug(err.response.error.path, err.response.error.status);
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

  url += bulkUpsertEndpoint;
  return new Promise((resolve) => {
    debug('Bulk upserting %d samples to %s', arr.length, url);
    doPost(url, userToken, proxy, arr, intervalSecs)
      .then((res) => {
        debug('doBulkUpsert returned OK %O', res.body);
        return resolve(res);
      },

      (err) => {
        debug('doBulkUpsert err %O', err);
        logger.error(err);

        /*
         * Don't Promise.reject(...) this error, because there is no handler
         * for the rejection.
         */
        return resolve(err);
      });
  });
} // doBulkUpsert

function validateSubjectQuery(q) {
  debug('validateSubjectQuery("%s")', q);
  if (!q) {
    const e = new ValidationError('Missing subject query');
    logger.error('attachSubjectsToGenerator', e.message);
    throw e;
  }

  let qry = q.startsWith('?') ? q.slice(1) : q;

  if (qry.includes(IS_PUBLISHED_FALSE)) {
    throw new Error('NO_SUBJECTS');
  }

  if (!qry.includes(IS_PUBLISHED_TRUE)) {
    qry += '&' + IS_PUBLISHED_TRUE;
  }

  debug('validateSubjectQuery returning %s', qry);
  return qry;
} // validateSubjectQuery

/**
 * Find Refocus subjects using query parameters.
 *
 * @param {Object} generator - Generator object from the heartbeat. Contains:
 *  {String} url - The Refocus url.
 *  {String} token - The Authorization token to use.
 *  {String} proxy - Optional proxy url
 *  {String} subjectQuery - the query string
 * @throws {ValidationError} if argument(s) is missing
 * @returns {Promise} Promise which resolves to generator object with subject
 *  array attached.
 */
function attachSubjectsToGenerator(generator) {
  const { url, proxy } = generator.refocus;
  const { token, subjectQuery, intervalSecs } = generator;
  const start = Date.now();

  debug('attachSubjectsToGenerator(url=%s, token=%s, proxy=%s, ' +
    'subjectQuery=%s)', url, token ? 'HAS_TOKEN' : 'MISSING', proxy,
  subjectQuery);

  if (!url) {
    const e = new ValidationError('Missing refocus url');
    logger.error('attachSubjectsToGenerator', e.message);
    return Promise.reject(e);
  }

  let qry;
  try {
    qry = validateSubjectQuery(subjectQuery);
  } catch (err) {
    debug('validateSubjectQuery threw', err);
    if (err.message === 'NO_SUBJECTS') {
      generator.subjects = [];
      return Promise.resolve(generator);
    }

    return Promise.reject(err);
  }

  if (!token) {
    const e = new ValidationError('Missing token');
    logger.error('attachSubjectsToGenerator', e.message);
    return Promise.reject(e);
  }

  function makeRequest() {
    const req = request.get(url + findSubjectsEndpoint)
      .query(qry)
      .set('Authorization', token)
      .set('collector-name', config.getConfig().name);
    if (proxy) {
      req.proxy(proxy);
    }

    return req.then((res) => {
      debug('attachSubjectsToGenerator returning %O', res.body);
      generator.subjects = res.body || [];
      return generator;
    });
  }

  return new Promise((resolve, reject) => {
    makeRequestWithRetry({
      makeRequest,
      resolve,
      reject,
      numAttempts: 1,
      start,
      cutoff: intervalSecs,
    });
  });
} // attachSubjectsToGenerator

module.exports = {
  doBulkUpsert,
  doPost,
  attachSubjectsToGenerator,
  validateSubjectQuery, // export for testing only
};
