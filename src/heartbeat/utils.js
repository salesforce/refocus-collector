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
const queueUtils = require('../utils/queueUtils');
const httpUtils = require('../utils/httpUtils');
const errors = require('../errors');
const collectorStatus = require('../constants').collectorStatus;

/**
 * Pauses, resumes or stops the collector based on the status of the collector
 * @param {String} currentStatus - The current status of the collector.
 * @param {String} newStatus - The new status of the collector.  This is the
 *  state the collector will be in, once this function has been executed.
 */
function changeCollectorStatus(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) {
    return;
  }

  if (newStatus === collectorStatus.STOPPED) {
    repeater.stopAllRepeat();
    queueUtils.flushAllBufferedQueues();
    process.exit(0);
  } else if (currentStatus !== newStatus &&
    newStatus === collectorStatus.PAUSED) {
    repeater.pauseGenerators();
  } else if (currentStatus !== newStatus &&
    newStatus === collectorStatus.RUNNING) {
    repeater.resumeGenerators();
  }
} // changeCollectorState

/**
 * Update the "collectorConfig" attribute of the config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function updateCollectorConfig(res) {
  const collectorConfig = res.collectorConfig;

  // get a fresh copy of collector config
  const config = configModule.getConfig();
  debug('Heartbeat response collectorConfig to update', collectorConfig);

  Object.keys(collectorConfig).forEach((key) => {
    config.refocus[key] = collectorConfig[key];
  });

  const sanitized = sanitize(config.refocus, ['accessToken', 'collectorToken']);
  debug('Collector config after updating', sanitized);
} // updateCollectorConfig

/**
 * Assign any default values from the template into the generator context if
 * no value was already provided in the generator context.
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

  debug('assignContext returning', ctx);
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
  if (commonUtils.isBulk(generator)) {
    repeater.createGeneratorRepeater(generator);
  } else {
    // bulk is false
    generator.subjects.forEach((s) => {
      const _g = JSON.parse(JSON.stringify(generator));
      _g.subjects = [s];
      repeater.createGeneratorRepeater(_g);
    });
  }
} // setupRepeater

/**
 * Create or update queue for sample generator
 * @param  {String} qName - Queue name
 * @param  {String} refocusUserToken - User token
 * @param  {Object} collConf - The collectorConfig from the start or
 *  heartbeat response
 */
function createOrUpdateGeneratorQueue(qName, refocusUserToken, collConf) {
  if (!qName) {
    // Throw error if qName is not provided.
    debug('Error: qName not found. Supplied %s', qName);
    throw new errors.ValidationError(
      'Queue name should be provided for queue creation.'
    );
  }

  const bq = queueUtils.getQueue(qName); // get queue
  if (bq) { // sample queue for this generator already exists
    if (!collConf) {
      debug('Error: missing or empty collector config.');
      throw new errors.ValidationError('Collector config is required.');
    }

    // update queue params
    if (collConf.maxSamplesPerBulkRequest) {
      bq._size = collConf.maxSamplesPerBulkRequest;
    }

    if (collConf.sampleUpsertQueueTime) {
      bq._flushTimeout = collConf.sampleUpsertQueueTime;
    }
  } else { // create new sample queue for this generator
    const cr = configModule.getConfig().refocus;
    const queueParams = {
      name: qName,
      size: cr.maxSamplesPerBulkRequest,
      flushTimeout: cr.sampleUpsertQueueTime,
      verbose: false,
      flushFunction: httpUtils.doBulkUpsert,
      proxy: cr.proxy,
      url: cr.url,
      token: refocusUserToken,
    };
    queueUtils.createQueue(queueParams);
  }
}

/**
 * Set up generator repeaters for each generator and add them to the collector
 * config.
 *
 * @param {Object} res - The start response or heartbeat response
 */
function addGenerators(res) {
  const generators = res.generatorsAdded;
  const config = configModule.getConfig(); // Get a fresh copy
  const token = config.refocus.collectorToken;
  if (generators && Array.isArray(generators)) {
    // Create a new repeater for each generator and add to config.
    generators.forEach((g) => {
      if (g.generatorTemplate.contextDefinition) {
        g.context = assignContext(g.context,
          g.generatorTemplate.contextDefinition, token, res);
      }

      // Add dataSourceProxy to connection, if specified
      if (g.generatorTemplate.connection.dataSourceProxy) {
        g.generatorTemplate.connection.dataSourceProxy = config.dataSourceProxy;
      }

      config.generators[g.name] = g;

      // queue name same as generator name
      createOrUpdateGeneratorQueue(g.name, g.token, res.collectorConfig || {});
      setupRepeater(g);
      debug('Generator added: %O', g);
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
  const token = config.refocus.collectorToken;
  if (generators && Array.isArray(generators)) {
    // Update the repeater for each generator and update in config.
    generators.forEach((g) => {
      if (g.generatorTemplate.contextDefinition) {
        g.context = assignContext(g.context,
          g.generatorTemplate.contextDefinition, token, res);
      }

      // Add dataSourceProxy to connection, if specified
      if (g.generatorTemplate.connection.dataSourceProxy) {
        g.generatorTemplate.connection.dataSourceProxy = config.dataSourceProxy;
      }

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
