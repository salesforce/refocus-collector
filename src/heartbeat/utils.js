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
const debug = require('debug')('refocus-collector:heartbeat');
const configModule = require('../config/config');
const repeater = require('../repeater/repeater');
const logger = require('winston');
const commonUtils = require('../utils/commonUtils');

// TODO: use the encryptionAlgorithm sent by refocus in the heartbeat response
const encryptionAlgorithm = require('../constants').encryptionAlgorithm;

/**
 * Update the "collectorConfig" attribute of the config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function updateCollectorConfig(res) {
  const collectorConfig = res.collectorConfig;

  // get a fresh copy of collector config
  const config = configModule.getConfig();
  if (collectorConfig) {
    debug('Heartbeat response collectorConfig to update', collectorConfig);
    debug('Collector config before updating', config);
    Object.keys(collectorConfig).forEach((key) => {
      config.collectorConfig[key] = collectorConfig[key];
    });
    debug('Collector config after updating', config.collectorConfig);
  }
} // updateCollectorConfig

/**
 * Assign any default values from the template into the generator context if
 * no value was already provided in the generator context.
 *
 * @param {Object} ctx - The context from the generator
 * @param {Object} def - The contextDefinition from the generator template
 * @param {Object} refocusInstance - The refocus instance object, contaning the
 * instance name, the refocus collector token for this instance and the refocus
 * instance url
 * @param {Object} res - The heartbeat response object
 * @returns {Object} the context object with default values populated
 */
function assignContext(ctx, def, refocusInstance, res) {
  if (!ctx) {
    ctx = {};
  }

  if (!def) {
    def = {};
  }

  const heartbeatTimestamp = res.timestamp;
  const collectorToken = refocusInstance.token;
  const secret = collectorToken + heartbeatTimestamp;

  Object.keys(def).forEach((key) => {
    if (!ctx.hasOwnProperty(key) && def[key].hasOwnProperty('default')) {
      ctx[key] = def[key].default;
    }

    if (ctx.hasOwnProperty(key) && def.hasOwnProperty(key) &&
      def[key].encrypted) {
      ctx[key] = commonUtils.decrypt(ctx[key], secret, encryptionAlgorithm);
    }
  });

  debug('assignContextDefaults returning', ctx);
  return ctx;
} // assignContextDefaults

/**
 * Creates a repeater based on the bulk attribute of the of the generator
 * object that is passed as as agrument. When the bulk attribute is true, it
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
 * Function to setup a generator repeater and add the generator to the
 * collector config.
 *
 * @param {Object} res - The Heartbeat Response object
 */
function addGenerator(res) {
  const generators = res.generatorsAdded;

  // Get a fresh copy of collector config
  const config = configModule.getConfig();
  const refocusInstance = config.registry.refocusInstances.sandbox;
  if (generators) {
    if (Array.isArray(generators)) {
      // Create a new repeater for each generator and add to config.
      generators.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContext(g.context,
            g.generatorTemplate.contextDefinition, refocusInstance, res);
        }

        config.generators[g.name] = g;
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
  const refocusInstance = config.refocusInstance;
  if (generators) {
    if (Array.isArray(generators)) {
      // Update the repeater for the generators and update the generator config.
      generators.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContext(g.context,
            g.generatorTemplate.contextDefinition, refocusInstance, res);
        }

        Object.keys(g).forEach((key) => {
          config.generators[g.name][key] = g[key];
        });

        /**
         * repeats cannot be updated. The old repeats needs to be stopped
         * before creating new repeats.
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
  deleteGenerator,
  updateGenerator,
  updateCollectorConfig,
};
