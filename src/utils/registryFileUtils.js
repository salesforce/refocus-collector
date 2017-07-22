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
  fs.writeFile(file, '{}', 'utf8', (err) => {
    if (err) {
      return debug(err);
    }

    debug('File %s is created successfully', file);
  });
}

/**
 * Delete registry file
 *
 * @param  {String} file - Name of the registry file
 *
 * @throws {Error} If registry file is not found
 */
function deleteRegistryFile(file) {
  file = file ? file : registryFile;
  try {
    fs.unlinkSync(file);
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

/**
 * Get Registry object based on name
 *
 * @param  {String} name - Name of the registry
 * @param  {String} file - Name of registry file
 * @return {Object} - Registry object related to name
 */
function getRegistry(name, file=null) {
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    if (name in registryData) {
      return registryData[name];
    } else {
      return new Error('There is no registry with name');
    }
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

/**
 * Add registry object to regostry file
 *
 * @param {String} name -  Name of the registry
 * @param {Object} registryObj - Registry Object to add
 * @param {String} file - Name of registry file
 */
function addRegistry(name, registryObj, file=null) {
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    registryData[name] = registryObj;
    const configJSON = JSON.stringify(registryData, null, 2);
    fs.writeFileSync(file, configJSON);
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

/**
 * Remove regsitry object based on name
 *
 * @param  {String} name - Name of the registry
 * @param  {String} file - Name of registry file
 *
 * @throws error If file is not found or registry data is not present
 */
function removeRegistry(name, file=null) {
  console.log('I am here');
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);
    if (registryData[name]) {
      delete registryData[name];
      const configJSON = JSON.stringify(registryData, null, 2);
      fs.writeFileSync(file, configJSON);
    } else {
      throw new Error('There is no registry entry based on name');
    }
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

/**
 * Update regstry object based on name
 *
 * @param  {String} name - Name of registry
 * @param  {Object} registryObj - Registry Object for updation
 * @param  {String} file - Name of registry file
 *
 * @throws {Error} If registry is not found or file is not found
 */
function updateRegistry(name, registryObj, file=null) {
  file = file ? file : registryFile;
  try {
    const registryFile = fs.readFileSync(file);
    let registryData = JSON.parse(registryFile);

    if (registryData[name]) {
      registryData[name] = registryObj;
      const configJSON = JSON.stringify(registryData, null, 2);
      fs.writeFileSync(file, configJSON);
    } else {
      throw new Error('There is no registry entry based on name');
    }

    const configJSON = JSON.stringify(registryData, null, 2);
    fs.writeFileSync(file, configJSON);
  } catch (err) {
    logger.error(err.message);
    logger.error(err);
  }
}

module.exports = {
  addRegistry,
  createRegistryFile,
  deleteRegistryFile,
  getRegistry,
  removeRegistry,
  updateRegistry,
};
