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
 * Function to setup a generator repeater and add the generator to the
 * collector config.
 *
 * @param {Object} res - The start or heartbeat response object
 */
function addGenerators(res) {
  const generators = res.generatorsAdded;
  debug('Getting ready to add generators:', generators);

  // Get a fresh copy of collector config
  const config = configModule.getConfig();
  const token = config.refocus.collectorToken;

  function addGenerator(g) {
    if (g.generatorTemplate.contextDefinition) {
      g.context = commonUtils.assignContext(g.context,
        g.generatorTemplate.contextDefinition, token, res);
    }

    config.generators[g.name] = g;

    // queue name same as generator name
    queueUtils.createOrUpdateGeneratorQueue(g.name, g.token,
      res.collectorConfig);
    repeater.setupRepeater(g);
    debug('Added generator to the config:', g);
  } // addGenerator

  if (generators) {
    if (Array.isArray(generators)) {
      // Create a new repeater for each generator and add to config.
      generators.forEach(addGenerator);
    } else {
      logger.error('generatorsAdded attribute must be an array');
    }
  } else {
    debug('No generators designated for addition');
  }
} // addGenerators

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
          g.context = commonUtils.assignContext(g.context,
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
        repeater.setupRepeater(g);
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
  addGenerators,
  changeCollectorStatus,
  deleteGenerator,
  updateGenerator,
  updateCollectorConfig,
};
