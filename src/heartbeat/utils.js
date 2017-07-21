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
 * Update the "collectorConfig" attribute of the config
 * @param {Object} res - Heartbeat Response
 */
function updateCollectorConfig(res) {
  // get a fresh copy of collector config
  const config = configModule.getConfig();
  if (res.collectorConfig) {
    debug('Heartbeat response collectorConfig to update', res.collectorConfig);
    debug('Collector config before updating', config);
    Object.keys(res.collectorConfig).forEach((key) => {
      config.collectorConfig[key] = res.collectorConfig[key];
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
 * Function to add or update a repeater.
 * @param {Object} generator - Generator object from the heartbeat
 */
function setUpRepeater(generator) {
  if (generator.generatorTemplate.connection.bulk === true) {
    repeater.createGeneratorRepeater(generator);
  } else if (generator.generatorTemplate.connection.bulk === false
    && generator.subject) {
    repeater.createGeneratorRepeater(generator);
  } else if (generator.generatorTemplate.connection.bulk === false
    && generator.subjects) {
    generator.subjects.forEach((subject) => {
      const _g = JSON.parse(JSON.stringify(generator));
      delete _g.subjects;
      _g.subject = subject;
      repeater.createGeneratorRepeater(_g);
    });
  }
} // setUpRepeater

/**
 * Function to setup a generator repeater and add the generator to the
 * collector config
 * @param {Object} res - Heartbeat Response
 */
function addGenerator(res) {
  // get a fresh copy of collector config
  const config = configModule.getConfig();
  if (res.generatorsAdded) {
    if (Array.isArray(res.generatorsAdded)) {
      // create a new repeater for the generators and add them to the config.
      res.generatorsAdded.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContextDefaults(g.context,
            g.generatorTemplate.contextDefinition);
        }

        config.generators[g.name] = g;
        setUpRepeater(g, repeater.createGeneratorRepeater);
      });

      debug('Added generators to the config:', res.generatorsAdded);
    } else {
      logger.error('generatorsAdded attribute should be an array');
    }
  }
} // addGenerator

/**
 * Function to stop the generator repeater and delete the generator from the
 * collector config
 * @param {Object} res - Heartbeat Response
 */
function deleteGenerator(res) {
  // get a fresh copy of collector config
  const config = configModule.getConfig();
  if (res.generatorsDeleted) {
    if (Array.isArray(res.generatorsDeleted)) {
      // Stop the repeater for the generators and delete them from config.
      res.generatorsDeleted.forEach((g) => {
        repeater.stop(g.name);
        delete config.generators[g.name];
      });

      debug('Deleted generators from the config: ', res.generatorsDeleted);
    } else {
      logger.error('generatorsDeleted attribute must be an array');
    }
  }
} // deleteGenerator

/**
 * Function to update the generator repeater and the collector config
 * @param {Object} res - Heartbeat Response
 */
function updateGenerator(res) {
  // get a fresh copy of collector config
  const config = configModule.getConfig();
  if (res.generatorsUpdated) {
    if (Array.isArray(res.generatorsUpdated)) {
      // Update the repeater for the generators and update the generator config.
      res.generatorsUpdated.forEach((g) => {
        if (g.generatorTemplate.contextDefinition) {
          g.context = assignContextDefaults(g.context,
            g.generatorTemplate.contextDefinition);
        }

        Object.keys(g).forEach((key) => {
          config.generators[g.name][key] = g[key];
        });

        /**
         * repeats cannot be updated. The old repeats needs to be stoppned
         * before creating new repeats
         */
        repeater.stop(g.name);
        setUpRepeater(g);
      });

      debug('Updated generators in the config: ', res.generatorsUpdated);
    } else {
      logger.error('generatorsUpdated attribute should be an array');
    }
  }
} // updateGenerator

module.exports = {
  addGenerator,
  assignContextDefaults, // exporting for testing purposes only
  deleteGenerator,
  updateGenerator,
  updateCollectorConfig,
};
