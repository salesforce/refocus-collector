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
function changeCollectorState(currentStatus, newStatus) {
  if (!currentStatus || !newStatus) {
    return;
  }

  if (newStatus === collectorStatus.STOPPED) {
    queueUtils.flushAllBufferedQueues();
    repeater.stopAllRepeat();
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
  debug('Collector config before updating', config);
  Object.keys(collectorConfig).forEach((key) => {
    config.refocus[key] = collectorConfig[key];
  });
  debug('Collector config after updating', config.refocus);
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
 * @param  {Object} res - The Heartbeat Response object
 */
function createOrUpdateGeneratorQueue(qName, refocusUserToken, res) {
  if (!qName) {
    // Throw error if qName is not provided.
    debug('Error: qName not found. Supplied %s', qName);
    throw new errors.ValidationError(
      'Queue name should be provided for queue creation.'
    );
  }

  const _bulkUpsertSampleQueue = queueUtils.getQueue(qName); // get queue
  if (_bulkUpsertSampleQueue) {
    if (!res) {
      // Throw error if heartbeat response is not provided.
      debug('Error: res not found. Supplied %s', res);
      throw new errors.ValidationError(
        'Heartbeat response should be provided for queue creation.'
      );
    }

    // update queue params
    if (res.collectorConfig) {
      if (res.collectorConfig.maxSamplesPerBulkRequest) {
        _bulkUpsertSampleQueue._size = res.collectorConfig
                                          .maxSamplesPerBulkRequest;
      }

      if (res.collectorConfig.sampleUpsertQueueTime) {
        _bulkUpsertSampleQueue._flushTimeout =
          res.collectorConfig.sampleUpsertQueueTime;
      }
    }
  } else { // create queue
    const config = configModule.getConfig();
    const queueParams = {
      name: qName,
      size: config.refocus.maxSamplesPerBulkRequest,
      flushTimeout: config.refocus.sampleUpsertQueueTime,
      verbose: false,
      flushFunction: httpUtils.doBulkUpsert,
      token: refocusUserToken,
    };
    queueUtils.createQueue(queueParams);
  }
}

/**
 * Function to setup a generator repeater and add the generator to the
 * collector config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function addGenerator(res) {
  const generators = res.generatorsAdded;

  // Get a fresh copy of collector config
  const config = configModule.getConfig();
  const token = config.refocus.collectorToken;
  if (generators) {
    if (Array.isArray(generators)) {
      // Create a new repeater for each generator and add to config.
      generators.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContext(g.context,
            g.generatorTemplate.contextDefinition, token, res);
        }

        config.generators[g.name] = g;

        // queue name same as generator name
        createOrUpdateGeneratorQueue(g.name, g.token, res);
        setupRepeater(g);
      });

      debug('Added generators to the config:', generators);
    } else {
      logger.error('generatorsAdded attribute must be an array');
    }
  } else {
    debug('No generators designated for addition');
  }
} // addGenerator

/**
 * Function to stop the generator repeater and delete the generator from the
 * collector config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function deleteGenerator(res) {
  const generators = res.generatorsDeleted;

  // Get a fresh copy of collector config
  const config = configModule.getConfig();
  if (generators) {
    if (Array.isArray(generators)) {
      // Stop the repeater for the generators and delete them from config.
      generators.forEach((g) => {
        repeater.stop(g.name);
        delete config.generators[g.name];
      });

      debug('Deleted generators from the config: ', generators);
    } else {
      logger.error('generatorsDeleted attribute must be an array');
    }
  } else {
    debug('No generators designated for deletion');
  }
} // deleteGenerator

/**
 * Function to update the generator repeater and the collector config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function updateGenerator(res) {
  const generators = res.generatorsUpdated;

  // Get a fresh copy of collector config.
  const config = configModule.getConfig();
  const token = config.refocus.collectorToken;
  if (generators) {
    if (Array.isArray(generators)) {
      // Update the repeater for the generators and update the generator config.
      generators.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContext(g.context,
            g.generatorTemplate.contextDefinition, token, res);
        }

        Object.keys(g).forEach((key) => {
          config.generators[g.name][key] = g[key];
        });

        /*
         * Repeaters cannot be updated. The old repeaters needs to be stopped
         * before creating new repeaters.
         */
        repeater.stop(g.name);
        setupRepeater(g);
      });

      debug('Updated generators in the config: ', generators);
    } else {
      logger.error('generatorsUpdated attribute should be an array');
    }
  } else {
    debug('No generators designated for update');
  }
} // updateGenerator

module.exports = {
  addGenerator,
  assignContext, // exporting for testing purposes only
  changeCollectorState,
  createOrUpdateGeneratorQueue, // exporting for testing purposes only
  deleteGenerator,
  updateGenerator,
  updateCollectorConfig,
};
