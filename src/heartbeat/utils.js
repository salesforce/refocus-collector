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

/**
 * Update the "collectorConfig" attribute of the config.
 *
 * @param {Object} collectorConfig - Heartbeat Response's "collectorConfig"
 *  attribute
 */
function updateCollectorConfig(collectorConfig) {
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
 * @returns {Object} the context object with default values populated
 */
function assignContextDefaults(ctx, def) {
  if (!ctx) {
    ctx = {};
  }

  if (!def) {
    def = {};
  }

  Object.keys(def).forEach((key) => {
    if (!ctx.hasOwnProperty(key) && def[key].hasOwnProperty('default')) {
      ctx[key] = def[key].default;
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
  if (generator.generatorTemplate.connection.bulk === true) {
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
 * @param {Array} generators - Heartbeat Response's "generatorsAdded"
 *  attribute, an array of generators
 */
function addGenerator(generators) {
  // Get a fresh copy of collector config
  const config = configModule.getConfig();
  if (generators) {
    if (Array.isArray(generators)) {
      // Create a new repeater for each generator and add to config.
      generators.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContextDefaults(g.context,
            g.generatorTemplate.contextDefinition);
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
 * @param {Array} generators - Heartbeat Response's "generatorsDeleted"
 *  attribute, an array of generators
 */
function deleteGenerator(generators) {
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
 * @param {Object} generators - Heartbeat Response's "generatorsUpdated"
 *  attribute, an array of generators.
 */
function updateGenerator(generators) {
  // Get a fresh copy of collector config.
  const config = configModule.getConfig();
  if (generators) {
    if (Array.isArray(generators)) {
      // Update the repeater for the generators and update the generator config.
      generators.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContextDefaults(g.context,
            g.generatorTemplate.contextDefinition);
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
  assignContextDefaults, // exporting for testing purposes only
  deleteGenerator,
  updateGenerator,
  updateCollectorConfig,
};
