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
const collect = require('../remoteCollection/collect').collect;
const handleCollectResponse =
  require('../remoteCollection/handleCollectResponse').handleCollectResponse;

/**
 * Pauses, resumes or stops the collector based on the status of the collector.
 *
 * @param {String} currentStatus - The current status of the collector.
 * @param {String} newStatus - The new status of the collector. This is the
 *  state the collector will be in, once this function has been executed.
 */
function changeCollectorStatus(currentStatus, newStatus) {
  // no-op if either arg is missing or if they are already the same status
  if (!currentStatus || !newStatus || (currentStatus === newStatus)) {
    return;
  }

  if (newStatus === collectorStatus.STOPPED) {
    repeater.stopAllRepeaters();
    queue.flushAll();
    process.exit(0);
  }

  if (newStatus === collectorStatus.PAUSED) {
    repeater.pauseGenerators();
  } else if (newStatus === collectorStatus.RUNNING) {
    repeater.resumeGenerators();
  }
} // changeCollectorState

/**
 * Update the collector config with any changes from the heartbeat response.
 *
 * @param {Object} cc - The collectorConfig from the Heartbeat Response object
 */
function updateCollectorConfig(cc) {
  const config = configModule.getConfig();
  Object.keys(cc).forEach((key) => config.refocus[key] = cc[key]);
  const sanitized = sanitize(config.refocus, ['accessToken', 'collectorToken']);
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
 * object that is passed as as argument. When the bulk attribute is true, it
 * creates a repeater using the passed in generator. When the bulk attribute
 * is false, it runs through the subjects array and creates a new generator
 * object for each subject, using the generator passed in as the argument),
 * and setting the "subjects" array to contain just the one subject.
 *
 * @param {Object} generator - Generator object from the heartbeat
 */
function setupRepeater(generator) {
  const sanitized = sanitize(generator, ['token']);
  debug('setupRepeater %O', sanitized);
  if (commonUtils.isBulk(generator)) {
    debug('Generator %s is bulk', generator.name);
    repeater.createGeneratorRepeater(generator, collect, handleCollectResponse);
  } else {
    // FIXME bulk is false
    generator.subjects.forEach((s) => {
      const _g = JSON.parse(JSON.stringify(generator));
      _g.subjects = [s];
      repeater.createGeneratorRepeater(_g, collect, handleCollectResponse);
    });
  }
} // setupRepeater

/**
 * Update queue for sample generator (if found), or create a new one.
 *
 * @param  {String} qName - Queue name
 * @param  {Object} collConf - The collectorConfig from the start or heartbeat
 *  response
 * @returns {Object} the buffered queue object
 */
function createOrUpdateGeneratorQueue(qName, token, collConf) {
  debug('createOrUpdateGeneratorQueue "%s" (%s) %O',
    qName, token ? 'HAS TOKEN' : 'MISSING TOKEN', collConf);
  if (!qName) throw new errors.ValidationError('Missing queue name');
  if (queue.exists(qName)) { // sample queue for this generator already exists
    if (!collConf) {
      throw new errors.ValidationError('Missing collector config');
    }

    // update queue params
    if (collConf.maxSamplesPerBulkRequest) {
      queue.updateSize(qName, collConf.maxSamplesPerBulkRequest);
    }

    if (collConf.sampleUpsertQueueTime) {
      queue.updateFlushTimeout(qName, collConf.sampleUpsertQueueTime);
    }

    return queue.get(qName);
  }

  // queue not found, so create new one for this generator
  const cr = configModule.getConfig().refocus;
  return queue.create({
    name: qName,
    size: cr.maxSamplesPerBulkRequest,
    flushTimeout: cr.sampleUpsertQueueTime,
    verbose: false,
    flushFunction: httpUtils.doBulkUpsert,
    proxy: cr.proxy,
    url: cr.url,
    token: token,
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
      if (g.generatorTemplate.connection.dataSourceProxy) {
        g.generatorTemplate.connection.dataSourceProxy = config.dataSourceProxy;
      }

      // Add Refocus url/proxy to generator
      g.refocus = { url: cr.url };
      if (cr.proxy) g.refocus.proxy = cr.proxy;

      config.generators[g.name] = g;

      // queue name same as generator name
      createOrUpdateGeneratorQueue(g.name, g.token, res.collectorConfig || {});
      setupRepeater(g);
      const sanitized = sanitize(g, ['token']);
      debug('Generator added: %O', sanitized);
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
      repeater.stop(g.name);
      delete config.generators[g.name];
      debug('Generator deleted: %s', g.name);
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
      if (g.generatorTemplate.contextDefinition) {
        g.context = assignContext(g.context,
          g.generatorTemplate.contextDefinition, cr.collectorToken, res);
      }

      // Add dataSourceProxy to connection, if specified
      if (g.generatorTemplate.connection.dataSourceProxy) {
        g.generatorTemplate.connection.dataSourceProxy = config.dataSourceProxy;
      }

      // Add Refocus url/proxy to generator
      g.refocus = { url: cr.url };
      if (cr.proxy) g.refocus.proxy = cr.proxy;

      Object.keys(g).forEach((key) => config.generators[g.name][key] = g[key]);

      // Repeaters cannot be updated--stop old ones and create new ones.
      repeater.stop(g.name);
      setupRepeater(g);
      debug('Generator updated: %O', g);
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
