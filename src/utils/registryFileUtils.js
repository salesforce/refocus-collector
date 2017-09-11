/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/utils/registryFileUtils.js
 * Registry Utility for registry.json file.
 * Registry file format:
 *   {
 *    "name": "MarysLinuxBoxCollector",
 *    "host": "mary-lx3",
 *    "ipAddress": "203.281.12.111",
 *    "description": "This collector runs on the linux box under Mary's desk so
 *    it is not production-level hardware and there is no guarantee that it will
 *    be running all the time. It has access to splunk and argus but use at your
 *    own risk.",
 *    "refocusInstances": {
 *      "foo": { "name": "foo", "url": "...", "token": "..." },
 *      "bar": { "name": "bar", "url": "...", "token": "..." }
 *    }
 * }
 *
 * TODO : Defaul name for refocus collector is Refocus-Collector
 * which can be modified by providing name.
 */
const registryFile = require('../constants').registryLocation;
const fs = require('fs');
const debug = require('debug')('refocus-collector:registryFileUtils');
const logger = require('winston');

/**
 * Create Registry File if not exist. If file is not passed
 * create registry file on default location which is specified in
 * constants
 *
 * @param {String} file - file for creating Registry file
 *
 * @throws error if file is not created or file is already create
 */
function createRegistryFile(file=null) {
  file = file ? file : registryFile;
  fs.writeFileSync(file, JSON.stringify({ name: 'Refocus-Collector',
    refocusInstances: {}, }, null, 2), 'utf8', (err) => {
    if (err) {
      return debug(err);
    }

    debug('File %s is created successfully', file);
  });
}

/**
 * Get refocus instance object based on name
 *
 * @param  {String} name - Name of the refocus instance
 * @param  {String} file - Name of registry file
 * @return {Object} - Refocus instance object related to name
 */
function getRefocusInstance(name, file=null) {
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    if (name in registryData.refocusInstances) {
      return registryData.refocusInstances[name];
    } else {
      return new Error('There is no registry with name');
    }
  } catch (err) {
    logger.error(err);
  }
}

/**
 * Add refocus instance object to registry file
 *
 * @param {String} name -  Name of the refocus instance
 * @param {Object} registryObj - Refocus instance Object to add
 * @param {String} file - Name of registry file
 *
 * @throws {Error} If file is not found
 */
function addRefocusInstance(name, registryObj, file=null) {
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    registryData.refocusInstances[name] = registryObj;
    const configJSON = JSON.stringify(registryData, null, 2);
    fs.writeFileSync(file, configJSON);
  } catch (err) {
    logger.error(err);
  }
}

/**
 * Remove refocus instance object based on name
 *
 * @param  {String} name - Name of the refocus instance
 * @param  {String} file - Name of registry file
 *
 * @throws {Error} If file is not found or registry data is not present
 */
function removeRefocusInstance(name, file=null) {
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    if (registryData.refocusInstances[name]) {
      delete registryData.refocusInstances[name];
      const configJSON = JSON.stringify(registryData, null, 2);
      fs.writeFileSync(file, configJSON);
    } else {
      throw new Error('There is no refocus instance entry based on name');
    }
  } catch (err) {
    logger.error(err);
  }
}

module.exports = {
  addRefocusInstance,
  createRegistryFile,
  getRefocusInstance,
  removeRefocusInstance,
};
