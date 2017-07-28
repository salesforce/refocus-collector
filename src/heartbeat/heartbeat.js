/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * src/heartbeat.js
 */
'use strict';
const debug = require('debug')('refocus-collector:heartbeat');
const logger = require('winston');
const errors = require('../config/errors');
const request = require('superagent');
const configModule = require('../config/config');
const handleHeartbeatResponse = require('./listener').handleHeartbeatResponse;
const generatorsDir = require('../constants').generatorsDir;
const fs = require('fs');
const Path = require('path');
const Promise = require('bluebird');
Promise.promisifyAll(fs);
let lastHeartbeatTime;

/**
 * Send a heartbeat to the Refocus server
 * @returns {Request} - the request sent to the Refocus server
 * @throws {ValidationError} - if required config fields are missing
 */
function sendHeartbeat(regObj) {
  debug('Entered sendHeartbeat');
  let collectorName;
  let registryName;
  let baseUrl;
  let token;
  let path;
  let url;

  try {
    //TODO: use the registry for this collector once command line args are setup
    collectorName = configModule.getConfig().name;

    registryName = regObj.name;
    baseUrl = regObj.url;
    token = regObj.token;
    path = `/v1/collectors/${collectorName}/heartbeat`;
    url = baseUrl + path;

    if (baseUrl == null) {
      throw new errors.ValidationError(`No url in registry for ${collectorName}`);
    }

    if (token == null) {
      throw new errors.ValidationError(`No token in registry for ${collectorName}`);
    }

    const body = {
      logLines: [],
    };

    return buildMockResponse(generatorsDir)
    .then(res => handleHeartbeatResponse(null, res))
    .catch(err => handleHeartbeatResponse(err, null));

    //TODO: send the real request and handle the response once the api can handle it
    //debug(`sendHeartbeat sending request. url: ${url} body: %o`, body);
    //
    //const req = request.post(url)
    //.set('Authorization', token)
    //.send(body);

    //.end(handleHeartbeatResponse)

    //return req;
  }
  catch (err) {
    if (!regObj) {
      throw new errors.ValidationError('Registry config Object is missing');
    } else {
      throw err;
    }
  }

}

/**
 * Read the generators from the specified directory and use them to create a
 * mock response.
 * @param {String} generatorsDir - path to the directory that contains the
 * generator files
 * @returns {Promise} - resolves to mock response object, rejects on any error
 * parsing any of the files in generatorsDir
 */
function buildMockResponse(generatorsDir) {
  debug(`buildMockResponse: ${generatorsDir}`);

  const parsedGenerators = {};
  const collectorConfig = {};
  const generatorsAdded = [];
  const generatorsUpdated = [];
  const generatorsDeleted = [];
  const config = configModule.getConfig();

  return fs.readdirAsync(generatorsDir)
    .then((filenames) => {
      const statPromises = [];
      const filePromises = [];
      filenames.forEach((filename) => {
        const filePath = Path.join(generatorsDir, filename);
        statPromises.push(fs.statAsync(filePath));
        filePromises.push(fs.readFileAsync(filePath));
      });

      return Promise.join(Promise.all(statPromises), Promise.all(filePromises),
        (statsList, fileList) => {
          filenames.forEach((filename) => {
            const stats = statsList.shift();
            const fileContents = fileList.shift();
            const lastModifiedTime = stats.mtime;
            let newGenerator;
            try {
              newGenerator = JSON.parse(fileContents);
            } catch (err) {
              logger.error('%s calling JSON.parse for filename "%s": %s',
                err.name, filename, err.message);
            }

            const isObject = typeof newGenerator === 'object';
            const isArray = newGenerator instanceof Array;
            if (!newGenerator || !isObject || isArray || !newGenerator.name) {
              throw new errors.ValidationError(`Invalid Generator in ${filename}`);
            }

            parsedGenerators[newGenerator.name] = newGenerator;

            // check if added or updated
            const existingGenerator = config.generators[newGenerator.name];
            if (!existingGenerator) {
              generatorsAdded.push(newGenerator);
            } else if (lastModifiedTime >= lastHeartbeatTime) {
              generatorsUpdated.push(newGenerator);
            }
          });

          // look for deleted generators
          Object.keys(config.generators).forEach((generatorName) => {
            if (!parsedGenerators[generatorName]) {
              generatorsDeleted.push(config.generators[generatorName]);
            }
          });

          lastHeartbeatTime = Date.now();

          const response = {
            collectorConfig,
            generatorsAdded,
            generatorsDeleted,
            generatorsUpdated,
          };

          debug(`buildMockResponse: returning ${response}`);
          return response;
        });
    });
}

module.exports = {
  sendHeartbeat,
  buildMockResponse, // export for testing
};
