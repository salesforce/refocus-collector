/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * ./src/config/config.js
 *
 * Configuration Settings - Exports getter and setter to get and set the
 * registry information
 */
const debug = require('debug')('refocus-collector:config');
const init = require('./utils').init;
const oauth2 = require('simple-oauth2');

/**
 * Config object created by loading local registry. This object is also
 * updated by the response from the hearbeat.
 * @type {Object}
 */
let config;

/**
 * Token object is for oauth2 which consist of accessToken and refreshToken
 *
 * @type {Object} 
 */
let token;

/**
 * Function to clear the config object.
 */
function clearConfig() {
  config = null;
} // clearConfig

/**
 * Initialize the config object. If the "reg" argument is an object, it is
 * assigned as the config registry. If the "reg" argument is a string, treat
 * it is a file location and try to assign the file contents as the config
 * registry.
 *
 * @param {String|Object} reg - Registry object or location of registry file
 */
function setRegistry(reg) {
  if (!config) {
    config = init(reg);
    debug('Initialized config: %o', config);
  }
} // setRegistry

/**
 * Returns the config object
 * @returns {Object} Config Object
 */
function getConfig() {
  return config;
} // getConfig


function createCredentialObject(clientId, clientSecret, host, path, bodyFormat) {
  return {
    client: {
      id: clientId,
      secret: clientSecret,
    },
    auth: {
      tokenHost: host,
      tokenPath: path,
    },
    options: {
      bodyFormat: bodyFormat,
    }
  }
}

function setToken(connection) {
  const username = connection.username;
  const password = connection.password;
  const clientId = connection.clientId;
  const clientSecret = connection.clientSecret;
  const host = connection.host;
  const path = connection.path;
  const bodyFormat = connection.bodyFormat ? connection.bodyFormat : 'json';
  const tokenConfig = {
  	username: username,
  	password: password,
  }

  const creadential = createCredentialObject(clientId, clientSecret,
  	host, path, bodyFormat);

  const outh2Credential = oauth2.create(creadential);

  outh2Credential.ownerPassword
    .getToken(tokenConfig)
    .then((res) => {
      debug('oauth2 token', res);
      token = oauth2.accessToken.create(res);

      return token;
    })
    .catch((err) => {
      console.log(err);
      debug('err', err);
    })
}

function getToken() {
  return token;
}


module.exports = {
  setRegistry,
  getConfig,
  getToken,
  setToken,
  clearConfig, // exported for testing
};
