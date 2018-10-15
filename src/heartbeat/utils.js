/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/heartbeat/utils.js
 */
'use strict'; // eslint-disable-line strict
const debug = require('debug')('refocus-collector:heartbeat');
const configModule = require('../config/config');
const repeater = require('../repeater/repeater');
const logger = require('winston');
const commonUtils = require('../utils/commonUtils');
const sanitize = commonUtils.sanitize;
const queue = require('../utils/queue');
const httpUtils = require('../utils/httpUtils');
const errors = require('../errors');
const collectorStatus = require('../constants').collectorStatus;
const collectBulk = require('../remoteCollection/collect').collectBulk;
const collectBySubject = require('../remoteCollection/collect').collectBySubject;
const handleCollectResponse =
  require('../remoteCollection/handleCollectResponse').handleCollectResponse;
const handleCollectResponseBySubject =
  require('../remoteCollection/handleCollectResponse').handleCollectResponseBySubject;

/**
 * Pauses, resumes or stops the collector based on the status of the collector.
 *
 * @param {String} currentStatus - The current status of the collector.
 * @param {String} newStatus - The new status of the collector. This is the
 *  state the collector will be in, once this function has been executed.
 */
function changeCollectorStatus(currentStatus, newStatus) {
  debug('changeCollectorStatus from %s to %s', currentStatus, newStatus);

  // no-op if either arg is missing or if they are already the same status
  if (!currentStatus || !newStatus || (currentStatus === newStatus)) {
    return;
  }

  if (newStatus === collectorStatus.PAUSED) {
    repeater.stopGenerators();
  } else if (newStatus === collectorStatus.STOPPED) {
    repeater.stopAllRepeaters();
    queue.flushAll();
    process.exit(0);
  }
} // changeCollectorState

/**
 * Update the collector config with any changes from the heartbeat response.
 *
 * @param {Object} cc - The collectorConfig from the Heartbeat Response object
 */
function updateCollectorConfig(cc) {
  const config = configModule.getConfig();
  Object.keys(cc).forEach((key) => {
    const oldValue = config.refocus[key];
    const newValue = cc[key];
    config.refocus[key] = cc[key];
    if (oldValue && newValue !== oldValue) {
      if (key === 'heartbeatIntervalMillis') {
        repeater.updateHeartbeatRepeater(newValue);
      } else if (key === 'sampleUpsertQueueTimeMillis') {
        queue.updateFlushTimeoutAll(newValue);
      } else if (key === 'maxSamplesPerBulkUpsert') {
        queue.updateSizeAll(newValue);
      }
    }
  });
  const sanitized = sanitize(config.refocus, configModule.attributesToSanitize);
  debug('exiting updateCollectorConfig %O', sanitized);
} // updateCollectorConfig

/**
 * Assign any default values from the template into the generator context if
 * no value was provided in the generator context.
 *
 * @param {Object} ctx - The context from the generator
 * @param {Object} def - The contextDefinition from the generator template
 * @param {Object} collectorToken - The token for this collector
 * @param {Object} res - The heartbeat response object
 * @returns {Object} the context object with default values populated
 */
function assignContext(ctx, def, collectorToken, res) {
  if (!ctx) {
    ctx = {};
  }

  if (!def) {
    def = {};
  }

  const heartbeatTimestamp = res.timestamp;
  const secret = collectorToken + heartbeatTimestamp;

  Object.keys(def).forEach((key) => {
    if (!ctx.hasOwnProperty(key) && def[key].hasOwnProperty('default')) {
      ctx[key] = def[key].default;
    }

    if (ctx.hasOwnProperty(key) && def.hasOwnProperty(key) &&
      def[key].encrypted) {
      ctx[key] = commonUtils.decrypt(ctx[key], secret, res.encryptionAlgorithm);
    }
  });

  debug('assignContext returning %O', ctx);
  return ctx;
} // assignContext

/**
 * Creates a repeater based on the bulk attribute of the of the generator
 * object, passing in either the "collectBulk" function or the
 * "collectBySubject" function, and the appropriate handler for each collect
 * function.
 *
 * @param {Object} generator - Generator object from the heartbeat
 * @throws {ValidationError} - Thrown by repeater.createGeneratorRepeater
 */
function setupRepeater(generator) {
  const genIsBulk = commonUtils.isBulk(generator);
  debug('setupRepeater (%s) for generator %O',
    genIsBulk ? 'bulk' : 'by subject', sanitize(generator));
  const collFunc = genIsBulk ? collectBulk : collectBySubject;
  const handlerFunc =
    genIsBulk ? handleCollectResponse : handleCollectResponseBySubject;
  repeater.createGeneratorRepeater(generator, collFunc, handlerFunc);
} // setupRepeater

/**
 * Update queue for sample generator (if found), or create a new one.
 *
 * @param  {String} qName - Queue name
 * @param  {String} token - The Authorization token to use.
 * @param  {Number} flushFunctionCutoff - time before we quit retrying the flush function
 * @param  {Object} collConf - The collectorConfig from the start or heartbeat
 *  response
 * @returns {Object} the buffered queue object
 * @throws {Error} Validation error if missing collector config
 */
function createOrUpdateGeneratorQueue(qName, token, flushFunctionCutoff, collConf) {
  debug('createOrUpdateGeneratorQueue "%s" (%s) %O',
    qName, token ? 'HAS TOKEN' : 'MISSING TOKEN', collConf);
  if (!qName) throw new errors.ValidationError('Missing queue name');
  if (queue.exists(qName)) { // sample queue for this generator already exists
    if (!collConf) {
      throw new errors.ValidationError('Missing collector config');
    }

    // update queue params
    if (collConf.maxSamplesPerBulkUpsert) {
      queue.updateSize(qName, collConf.maxSamplesPerBulkUpsert);
    }

    if (collConf.sampleUpsertQueueTimeMillis) {
      queue.updateFlushTimeout(qName, collConf.sampleUpsertQueueTimeMillis);
    }

    return queue.get(qName);
  }

  // queue not found, so create new one for this generator
  const cr = configModule.getConfig().refocus;
  return queue.create({
    name: qName,
    size: cr.maxSamplesPerBulkUpsert,
    flushTimeout: cr.sampleUpsertQueueTimeMillis,
    verbose: false,
    flushFunction: httpUtils.doBulkUpsert,
    proxy: cr.proxy,
    url: cr.url,
    token: token,
    flushFunctionCutoff,
  });
} // createOrUpdateGeneratorQueue

/**
 * Set up generator repeaters for each generator and add them to the collector
 * config.
 *
 * @param {Object} res - The start response or heartbeat response
 */
function addGenerators(res) {
  const generators = res.generatorsAdded;
  const config = configModule.getConfig(); // Get a fresh copy
  const cr = config.refocus;
  if (generators && Array.isArray(generators)) {
    // Create a new repeater for each generator and add to config.
    generators.forEach((g) => {
      if (g.generatorTemplate.contextDefinition) {
        g.context = assignContext(g.context,
          g.generatorTemplate.contextDefinition, cr.collectorToken, res);
      }

      // Add dataSourceProxy to connection, if specified
      if (config.dataSourceProxy) {
        g.generatorTemplate.connection.dataSourceProxy = config.dataSourceProxy;
      }

      // Add Refocus url/proxy to generator
      g.refocus = { url: cr.url };
      if (cr.proxy) g.refocus.proxy = cr.proxy;

      config.generators[g.name] = g;

      try {
        // queue name same as generator name
        createOrUpdateGeneratorQueue(g.name, g.token, g.intervalSecs,
          res.collectorConfig || {});
        setupRepeater(g);
      } catch (err) {
        debug('addGenerators error for generator "%s":\n%s', g.name,
          err.message);
        logger.error(`addGenerators error for generator "${g.name}":\n`,
          err.message);
      }

      debug('Generator added: %O', sanitize(g));
    });
  } else {
    debug('No generators to add.');
  }
} // addGenerators

/**
 * Stop generator repeaters and delete generators from collector config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function deleteGenerators(res) {
  const generators = res.generatorsDeleted;
  const config = configModule.getConfig(); // Get a fresh copy
  if (generators && Array.isArray(generators)) {
    // Stop the repeater for each generator and delete from config.
    generators.forEach((g) => {
      debug('deleteGenerators: generator "%s"...', g.name);
      repeater.stop(g.name);
      delete config.generators[g.name];
      debug('Generator "%s" deleted', g.name);
    });
  } else {
    debug('No generators to delete.');
  }
} // deleteGenerators

/**
 * Update generator repeaters and collector config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function updateGenerators(res) {
  const generators = res.generatorsUpdated;
  const config = configModule.getConfig(); // Get a fresh copy
  const cr = config.refocus;
  if (generators && Array.isArray(generators)) {
    // Update the repeater for each generator and update in config.
    generators.forEach((g) => {
      debug('updateGenerators: generator "%s"...', g.name);
      if (g.generatorTemplate.contextDefinition) {
        g.context = assignContext(g.context,
          g.generatorTemplate.contextDefinition, cr.collectorToken, res);
      }

      // Add dataSourceProxy to connection, if specified
      if (config.dataSourceProxy) {
        g.generatorTemplate.connection.dataSourceProxy = config.dataSourceProxy;
      }

      // Add Refocus url/proxy to generator
      g.refocus = { url: cr.url };
      if (cr.proxy) g.refocus.proxy = cr.proxy;

      Object.keys(g).forEach((key) => config.generators[g.name][key] = g[key]);

      // Repeaters cannot be updated--stop old ones and create new ones.
      try {
        repeater.stop(g.name);
        setupRepeater(g);
      } catch (err) {
        debug('updateGenerators error for generator "%s":\n%s', g.name,
          err.message);
        logger.error(`updateGenerators error for generator "${g.name}":\n`,
          err.message);
      }

      debug('Generator updated: %O', sanitize(g));
    });
  } else {
    debug('No generators to update.');
  }
} // updateGenerators

module.exports = {
  addGenerators,
  assignContext, // exporting for testing purposes only
  changeCollectorStatus,
  createOrUpdateGeneratorQueue, // exporting for testing purposes only
  deleteGenerators,
  updateGenerators,
  updateCollectorConfig,
};
