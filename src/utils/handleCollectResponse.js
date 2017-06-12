/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/functionUtils/handleCollectResponse.js
 */
const debug = require('debug')('refocus-collector:handleCollectResponse');
const evalUtils = require('./evalUtils');
const doBulkUpsert = require('../sampleQueue/sampleUpsertUtils').doBulkUpsert;
const config = require('../config/config').getConfig();
const errors = require('../errors/errors');
const logger = require('winston');

/**
 * Handles the response from the remote data source by calling the transform
 * function. It also calls the sample bulk upsert api to send the data to the
 * configured refocus instance immediately. In the later versions,
 * instead of calling the sample bulk upsert API immediately, we can start
 * storing the sample in an in-memory sample queue.
 * @param  {Object} collectRes - Response from the "collect" function. It is
 * all the attributes of the sampleGenerator, along with a "res" attribute
 * that holds the response from the remote data source.
 * @returns {Promise} - which can be resolved to the response of the sample
 * bulk upsert API. An error object is returned if an error is thrown.
 * @throws {ArgsError} If the argument "collectRes" is not an object.
 * @throws {ValidationError} If the argument "collectRes" does not have a "res"
 *  or "ctx" or "subject|subjects" and "transform" attribute.
 */
function handleCollectResponse(collectRes) {
  debug('Entered handleCollectResponse:', collectRes);
  try {
    if (!collectRes || typeof collectRes !== 'object' ||
      Array.isArray(collectRes)) {
      throw new errors.ArgsError('The argument to handleCollectResponse ' +
        'cannot be null or an Array');
    }

    if (!collectRes.res) {
      throw new errors.ValidationError('The object passed to ' +
        'handleCollectResponse should have a res attribute');
    }

    const transformedSamples =
      evalUtils.safeTransform(collectRes.transform, collectRes);

    // for now, get only the values mapped to the first attribute of registry
    const registry = config.registry[Object.keys(config.registry)[0]];
    return doBulkUpsert(registry, transformedSamples);
  } catch (err) {
    logger.log('error', 'handleCollectResponse threw an error: ',
      err.name, err.message);
    return err;
  }
} // handleCollectResponse

module.exports = {
  handleCollectResponse,
};
