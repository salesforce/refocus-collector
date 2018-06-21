/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/constants.js
 *
 * Constants
 */

module.exports = {

  // bulk upsert path, use with config.refocus.url
  bulkUpsertEndpoint: '/v1/samples/upsert/bulk',

  // subject find, use with config.refocus.url
  findSubjectsEndpoint: '/v1/subjects',

  // fraction of heartbeat interval time before abandoning the request.
  // a value of 2 would be 1/2 of heartbeat interval time, 3 is 1/3, etc.
  heartbeatCutoffFraction: 2,

  httpStatus: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    REDIRECT: 301,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    NOT_ALLOWED: 405,
    TOO_MANY_REQUESTS: 429,
    SERVICE_UNAVAILABLE: 503,
  },

  collectorStatus: {
    STOPPED: 'Stopped',
    PAUSED: 'Paused',
    RUNNING: 'Running',
  },

  heartbeatRepeatName: 'heartbeat',
};
